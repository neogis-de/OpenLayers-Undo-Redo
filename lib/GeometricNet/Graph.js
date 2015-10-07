/**
 * Class: GeometricNet.Graph
 * Instance of GeometricNet.Graph is used to create graph 
 * a-star funtion for shortest path search is taken form Brian Grinstead'code 
 * (http://www.briangrinstead.com/blog/astar-search-algorithm-in-javascript)	
 */
GeometricNet.Graph = OpenLayers.Class( {
	
	/**
	 * APIProperty: node
	 * {GeometricNet.Layer.Vector.Node} Node layer of the network associated with
	 *		this graph.
	 */
	node: null,

	/**
	 * APIProperty: edge
	 * {GeometricNet.Layer.Vector.Edge} Edge layer of the network associated with
	 *		this graph.
	 */
	edge: null,	
	
	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,

	/**
	 * Constructor: GeometricNet.Graph
	 *
	 * Parameters:
	 * edge - {GeometricNet.Layer.Vector.Edge} Edge layer of the network
	 * node - {GeometricNet.Layer.Vector.Node} Node layer of the network
	 * options - {Object} Hashtable of extra options onto layer
	 */	
	initialize: function(edge,node,options) {
		this.edge = edge;
		this.node = node;		
	},
	
	/**
	 * Method: resetScore
	 * Reset all scores to 0 for all nodes
	 */
	resetScore: function(){
		//TODO: load only nodes that are within start and end node extent
		for(var i=0;i<this.node.features.length;i++){
			this.node.features[i].f = 0;
			this.node.features[i].g = 0;
			this.node.features[i].h = 0;
			this.node.features[i].debug = "";
			this.node.features[i].parent = null;
		}
	},
	
	/**
	 * APIMethod: aStarSearch
	 * Search the shortest path between nodes based on a-star algorithm
	 * 
	 * Parameters:
	 * start - {GeometricNet.Feature.Vector.Node}
	 * end - {GeometricNet.Feature.Vector.Node}
	 */
	aStarSearch: function(start,end) {		
		this.resetScore(); //reset all nodes score to 0
        var openList   = [];
        var closedList = [];
        openList.push(start);
        var counter=0;
        while(openList.length > 0 && counter < 1000) {
        	counter +=1;
        	if (this.debug) { console.log("counter: "+counter);}
        	// Grab the lowest f(x) to process next
            var lowInd = 0;
            for(var i=0; i<openList.length; i++) {
			    if(openList[i].f < openList[lowInd].f) { lowInd = i; }
		    }
		    var currentNode = openList[lowInd];
		    
		    // End case -- result has been found, return the traced path
		    if(currentNode == end) {
			    var curr = currentNode;
			    var ret = [];
			    while(curr.parent) {
				    ret.push(curr);
				    curr = curr.parent;
			    }
			    ret.push(curr);
			    return ret.reverse();
		    }
    		
		    // Normal case -- move currentNode from open to closed, process each of its neighbors
		    //openList.removeGraphNode(currentNode);
		    OpenLayers.Util.removeItem(openList,currentNode);
		    closedList.push(currentNode);
		    var neighbors = this.getNeighbors(currentNode);
    		
		    for(var i=0; i<neighbors.length;i++) {
			    var neighbor = neighbors[i];
			    //if(closedList.isKey(neighbor) || neighbor.isWall()) {
			    if(closedList.isKey(neighbor) ) {
				    // not a valid node to process, skip to next neighbor
				    continue;
			    }
    			
			    // g score is the shortest distance from start to current node, we need to check if
			    //   the path we have arrived at this neighbor is the shortest one we have seen yet
			    var gScore = currentNode.g + this.getCost(currentNode,neighbor); // 1 is the distance from a node to it's neighbor
			    var gScoreIsBest = false;
    			
    			
			    if(!openList.isKey(neighbor)) {
				    // This the the first time we have arrived at this node, it must be the best
				    // Also, we need to take the h (heuristic) score since we haven't done so yet
    				
				    gScoreIsBest = true;
				    neighbor.h = this.calculateHeuristic(neighbor, end);
				    openList.push(neighbor);
			    }
			    else if(gScore < neighbor.g) {
				    // We have already seen the node, but last time it had a worse g (distance from start)
				    gScoreIsBest = true;
			    }
    			
			    if(gScoreIsBest) {
				    // Found an optimal (so far) path to this node.  Store info on how we got here and
				    //  just how good it really is...
				    neighbor.parent = currentNode;
				    neighbor.g = gScore;
				    neighbor.f = neighbor.g + neighbor.h;
				    neighbor.debug = "F: " + neighbor.f + "<br />G: " + neighbor.g + "<br />H: " + neighbor.h;
				}
		    }
        }        
        // No result was found -- empty array signifies failure to find path
        return [];
	},
	
	/**
	 * APIMethod: getNeighbors
	 * Function to find the neighbors of a node
	 * 
	 * Parameters:
	 * node - GeometricNet.Feature.Vector.Node
	 * Returns - array of GeometricNet.Feature.Vector.Node
	 */
	getNeighbors: function(node) {
		var neighbors = [];
		var edge,neighbor;
		for(var i=0;i< node.attributes.startEdges.length;i++) {
			edge = this.edge.getFeatureByFid(node.attributes.startEdges[i]);
			if (edge) {
				neighbor = this.node.getFeatureByFid(edge.attributes.endNode);
				neighbors.push(neighbor);
			}
		}
		for(var i=0;i< node.attributes.endEdges.length;i++) {
			edge = this.edge.getFeatureByFid(node.attributes.endEdges[i]);
			if (edge) {
				neighbor = this.node.getFeatureByFid(edge.attributes.startNode);
				neighbors.push(neighbor);
			}
		}
		return neighbors;
	},
	
	/** 
	 * APIMethod: calculateHeuristic
	 * Function to calculate heuristic based on Euclidean distance
	 * 
	 * Parameters:
	 * fromNode -  GeometricNet.Feature.Vector.Node
	 * toNode - GeometricNet.Feature.Vector.Node
	 * Returns:
	 * distance - float
	 */
	calculateHeuristic: function(fromNode,toNode) {
		var deltaX = fromNode.geometry.x - toNode.geometry.x;
		var deltaY = fromNode.geometry.y - toNode.geometry.y;
		return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
	},
	
	/** 
	 * APIMethod: getCost
	 * function to get the cost from one node to another
	 * 
	 * Parameters:
	 * fromNode -  GeometricNet.Feature.Vector.Node
	 * toNode - GeometricNet.Feature.Vector.Node
	 * Returns:
	 * distance - float
	 */
	getCost: function(fromNode,toNode) {		
		for(var i=0;i< fromNode.attributes.startEdges.length;i++) {
			edge = this.edge.getFeatureByFid(fromNode.attributes.startEdges[i]);
			if (edge) {
				neighbor = this.node.getFeatureByFid(edge.attributes.endNode);
				if (neighbor == toNode) {
					return edge.geometry.getLength();
				}		
			}	
		}
		for(var i=0;i< fromNode.attributes.endEdges.length;i++) {
			edge = this.edge.getFeatureByFid(fromNode.attributes.endEdges[i]);
			if (edge) {
				neighbor = this.node.getFeatureByFid(edge.attributes.startNode);
				if (neighbor == toNode) {
					return edge.geometry.getLength();
				}			
			}
		}
		return -1;
	},
	
	/**
	 * APIMethod getEdge
	 * function to get the edge between two node
	 * Parameters:
	 * fromNode -  GeometricNet.Feature.Vector.Node
	 * toNode - GeometricNet.Feature.Vector.Node
	 * Returns:
	 * edge -  GeometricNet.Feature.Vector.Edge
	 */
	 getEdge: function(fromNode,toNode) {
		for(var i=0;i< fromNode.attributes.startEdges.length;i++) {
			edge = this.edge.getFeatureByFid(fromNode.attributes.startEdges[i]);
			if (edge) {
				neighbor = this.node.getFeatureByFid(edge.attributes.endNode);
				if (neighbor == toNode) {
					return edge;
				}			
			}
		}
		for(var i=0;i< fromNode.attributes.endEdges.length;i++) {
			edge = this.edge.getFeatureByFid(fromNode.attributes.endEdges[i]);
			if (edge) {
				neighbor = this.node.getFeatureByFid(edge.attributes.startNode);
				if (neighbor == toNode) {
					return edge;
				}			
			} 
		}
		return false;
	 },
	 
	 /**
	  * APIMethod getPathEdges
	  * function to get the ordered list of edges
	  * Parameters:
	  * nodes - array of GeometricNet.Feature.Vector.Node
	  * Returns:
	  * edges - array of GeometricNet.Feature.Vector.Edge
	  */
	 getPathEdges: function(nodes) {
		 var edges = [];
		 for(var i=0;i<nodes.length-1;i++) {
			 edges.push(this.getEdge(nodes[i],nodes[i+1]));
		 }
		 return edges;
	 }, 		  
	 
	CLASS_NAME: "GeometricNet.Graph" 
});
