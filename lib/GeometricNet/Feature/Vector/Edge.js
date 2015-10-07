/**
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Feature.Vector.Edge
 * class to represent the edge feture of network
 * Inherits from:
 * - <OpenLayers.Feature.Vector>
 */
 
GeometricNet.Feature.Vector.Edge = OpenLayers.Class(OpenLayers.Feature.Vector, {
	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,
	/**
	 * APIProperty: edgeType
	 * {string}
	 * edge type of the network
	 */
	//edgeType: null, part of attributes
	
	/**
	 * Constructor: GeometricNet.Feature.Edge
	 *
	 * Parameters:
	 * lineString - {OpenLayers.Geometry.LineString}
	 * attributes - attributes of the edge feature 	 
	 * options - {Object} Hashtable of extra options 
	 * Valid Options:
	 *	
	 */
	initialize: function(lineString, attributes,options) {
		options = options ? options : {}; 		
		if (lineString instanceof OpenLayers.Geometry.LineString) {
			if (attributes == undefined) { attributes = {}; }		
			var newArguments = [];
	        newArguments.push(lineString,attributes);
			OpenLayers.Feature.Vector.prototype.initialize.apply(this,newArguments);
			//this.fid = options.fid ? options.fid : null;
			for(option in options){
				this[option] = options[option];
			}
		} else {
			//TODO send error message
			return null;
		}		
	},
	/**
	 * Constructor: CreateFromVector
	 * Create a new edge from vector feature 
	 * Parameters:
	 * feature - {<OpenLayers.Feature.Vector>}
	 */
	CreateFromVector: function(feature){
		if(feature instanceof OpenLayers.Feature.Vector) {
			return new GeometricNet.Feature.Vector.Edge(
							feature.geometry,feature.attributes,{fid:feature.fid});
		}
		return null;
	},

	/**
	 * Method : splitWith
	 * Function for splitting the edge when a node is inserted on it. Also add associated node id.
	 * Parameters:
	 * node - {OpenLayers.Feature.Vector.Node}
	 */
	splitWith: function(node) {
		//var TOLERANCE = 1.0; //TODO this has to be variable from edge layer
		var TOLERANCE = this.layer.network.config.tolerance;
		//check if the node intersects the edge
		//TODO incorporate tolerance, second thought may not be required here 
		//if (this.geometry.intersects(node.geometry)) { //TODO do with intersects
		if (this.debug)	{
			console.log("Feature.Vector.Edge.js - distance to node:"+this.geometry.distanceTo(node.geometry)) ;
			console.log("Feature.Vector.Edge.js - this edge layer tolerance :" + TOLERANCE);
			console.log("Feature.Vector.Edge.js - this edge layer node  :" + this.layer.node.name);
		}		
		if (this.geometry.distanceTo(node.geometry) < TOLERANCE) {
			//var geometries = this.geometry.splitWith(node.geometry);
			// TODO as geometry.splitWith is not working with very very near point
			var result = GeometricNet.Util.LRSMeasure(this.geometry,node.geometry,{details: true, tolerance : TOLERANCE});
			var geometries = [result.subString1,result.subString2];
			if (this.debug)	{
				console.log("edge  to split : " + this.geometry.toString());
				console.log("node that will split: "  + node.geometry.toString());
				console.log("result.subString1:"+ result.subString1.toString());
				console.log("result.subString2:"+ result.subString2.toString());
				console.log("geometries[0]: " + geometries[0].toString());
				console.log("geometries[1]: " + geometries[1].toString());
			}
			if (geometries.length > 1)	{				
				var part1Attributes,part2Attributes;
				var part1,part2;
				//create split edge part 1	
				part1Attributes = OpenLayers.Util.extend({},this.attributes);
				part1 = new GeometricNet.Feature.Vector.Edge(geometries[0],
							part1Attributes,{fid : this.layer.createUniqueFid()});
				part1.toState(OpenLayers.State.INSERT);
				part1.attributes.endNode = node.fid;

				//create split edge part 2
				part2Attributes = OpenLayers.Util.extend({},this.attributes);								
				part2 = new GeometricNet.Feature.Vector.Edge(geometries[1],
							part2Attributes,{fid : this.layer.createUniqueFid()});
				part2.toState(OpenLayers.State.INSERT);
				part2.attributes.startNode = node.fid;

				//set node's network attributes
				if (node.attributes.endEdges == undefined) { node.attributes.endEdges = [];	}
				if (node.attributes.startEdges == undefined) { node.attributes.startEdges = [];	}

				var partStartNode,partEndNode;
				//set node's network attributes i.e. association to part 1				
				partStartNode = this.layer.node.getFeatureByFid(this.attributes.startNode)
				if (partStartNode){				
					if (partStartNode.attributes.startEdges == undefined )	{
						partStartNode.attributes.startEdges = [];
					} else {
						OpenLayers.Util.removeItem(partStartNode.attributes.startEdges,this.fid);
					}
					partStartNode.attributes.startEdges.push(part1.fid);
				}
				
				partEndNode = node;
				if (partEndNode){
					partEndNode.attributes.endEdges.push(part1.fid);
					if (this.debug) {
						console.log("Edje.js - splitEdges - part1.attributes.endNode.attributes.endEdges[0].fid : "
								+ partEndNode.attributes.endEdges[0].fid );
					}
				}
				

				//set node's network attributes i.e. association to part 2				
				partEndNode = this.layer.node.getFeatureByFid(this.attributes.endNode);
				if (partEndNode) {
					if (partEndNode.attributes.endEdges == undefined )	{
						partEndNode.attributes.endEdges = [];
					} else {
						if (this.debug) {
							console.log("Edje.js - splitEdges - part2 endEdges  : " +partEndNode.attributes.endEdges);
						}	
						OpenLayers.Util.removeItem(partEndNode.attributes.endEdges,this.fid);
					}				
					partEndNode.attributes.endEdges.push(part2.fid);
				}
				partStartNode = node;				
				partStartNode.attributes.startEdges.push(part2.fid);
				
				part1.layer = this.layer;
				part2.layer = this.layer;
				if (this.debug) {
					console.log("Edje.js - splitEdges - part1 layer: " +part1.layer.name);					
				}
				return [part1,part2];
			}			
		} else {
			return null;
		}		
	},
	/**
	 * Method: snapToNode
	 *	snap end of the edge to the given node
	 *	TODO: when move end of the edge check nearby verices within tolerance if exist 
	 *			- then how to remove them ? may be simplify the geometry
	 * Paramaters:
	 *	node - {<GeometricNet.Feature.Vector.Node>}
	 *	nodeIndex - <integer>  , 0 - start node of the edge, 1- end node of the edge
	 * Retruns:
	 */
	snapToNode: function(node,nodeIndex) {
		var vertices =[];
		vertices = this.geometry.getVertices();
		if  (nodeIndex ==0) {      
				vertices[0]=node.geometry.clone();
				var oldStartNode = this.layer.node.getFeatureByFid(this.attributes.startNode);
				if (oldStartNode) {
					OpenLayers.Util.removeItem(oldStartNode.attributes.startEdges,this.fid);	
				}								
				this.attributes.startNode = node.fid;				
				node.attributes.startEdges.push(this.fid);				
		} else if (nodeIndex ==1){ 				
				vertices[vertices.length-1]=node.geometry.clone();
				var oldEndNode =  this.layer.node.getFeatureByFid(this.attributes.endNode);				
				if (oldEndNode){
					OpenLayers.Util.removeItem(oldEndNode.attributes.endEdges,this.fid);	
				}				
				this.attributes.endNode = node.fid;				
				node.attributes.endEdges.push(this.fid);				
		} else {                   
			return "msg";          
		}
		node.toState(OpenLayers.State.UPDATE);
		this.geometry.destroy();
		this.geometry = new OpenLayers.Geometry.LineString(vertices);
		if (this.state == undefined) {
			this.toState(OpenLayers.State.UPDATE);
		}
	},
	
	/**
	 * APIMethod: canSnapToNode
	 * checks whether this edge node can be snapped to given node based on network association
	 * Parameters:
	 * node - {<GeometricNet.Feature.Vector.Node>}
	 * nodeIndex - <integer>  , 0 - start node of the edge, 1- end node of the edge
	 * Retruns:
	 * {boolean}
	 */
	canSnapToNode: function(targetNode,nodeIndex){
		var targetNodeDetail = this.layer.network.config.nodeLayer.nodes[targetNode.attributes.nodeType];
		var edgeTypeCount;
		if (nodeIndex == 0) {			
			if (targetNodeDetail.startEdges.hasOwnProperty(this.attributes.edgeType) ){				
				if(targetNode.getEdgeCount(this.attributes.edgeType,0) 
					< targetNodeDetail.startEdges[this.attributes.edgeType].maxCount ) {
					return true;
				}
			} 
		} else if (nodeIndex == 1) {
			if (targetNodeDetail.endEdges.hasOwnProperty(this.attributes.edgeType) ){				
				if(targetNode.getEdgeCount(this.attributes.edgeType,1) 
					< targetNodeDetail.endEdges[this.attributes.edgeType].maxCount ) {
					return true;
				}
			} 			
		} else {
			return "msg";			
		}
		return false;		
	},
	
	/**
	 * APIMethod: canSnapToEdge
	 * checks whether this edge node can be snapped to given edge based on network association
	 * TODO - considering startNode and endNode of this edge are only attached to this edge
	 * Parameters:
	 * node - {<GeometricNet.Feature.Vector.Edge>}
	 * nodeIndex - <integer>  , 0 - start node of the edge, 1- end node of the edge
	 * Retruns:
	 * {boolean}
	 */
	canSnapToEdge: function(targetEdge,nodeIndex){
		//TODO 
	},
	
	/**
	 * Method: splitWithNodes
	 *	split the edge with array of nodes that intersect with edge
	 * Parameters:
	 *	nodes - array of {<GeometricNet.Feature.Vector.Node>}}
	 * Returns:
	 *	{Array} - A list of all splitted edges 
	 */
	splitWithNodes: function(shootingNodes) {
		var splittedEdges = [this];
		var splitPair = [];
		if (shootingNodes.length == 1 )	{
			return this.splitWith(shootingNodes[0]);
		} else if (shootingNodes.length > 1) {
			//get sorted measure of each point
			var sortedNodes = [];
			var nodes =[];
			var measure;			
			for (var i=0;i<shootingNodes.length ; i++ ) {				
				measure = GeometricNet.Util.LRSMeasure(this.geometry,shootingNodes[i].geometry,{tolerance:this.layer.network.config.tolerance});				
				nodes.push([shootingNodes[i],measure]);
			}
			sortedNodes = GeometricNet.Util.multiSort(nodes,1);
			for (var i=0;i<	sortedNodes.length;i++){
				if (this.debug){
					console.log(" - splitWithNodes - "+splittedEdges[splittedEdges.length-1].geometry.toString());
					console.log(" - splitWithNodes - "+sortedNodes[0][1].geometry.toString());
				}
				splitePair = splittedEdges[splittedEdges.length-1].splitWith(sortedNodes[i][1]);
				splittedEdges.splice(splittedEdges.length-1,1);
				splittedEdges.push(splitePair[0],splitePair[1]);				
			}			
			return splittedEdges;
		} else {
			return false;
		}		
	},
	
	/**
	 * APIMethod: getStartNode
	 * return start node of the edge
	 * Returns:
	 * <GeometricNet.Layer.Vector.Node>} - node
	 */
	getStartNode: function(){
		return this.layer.network.node.getFeatureByFid(this.attributes.startNode);
	},
	
	/**
	 * APIMethod: getEndNode
	 * return end node of the edge
	 * Returns:
	 * <GeometricNet.Layer.Vector.Node>} - node
	 */
	getEndNode: function(){
		return this.layer.network.node.getFeatureByFid(this.attributes.endNode);
	},
	
	getLayer: function(){
		return this.layer;
	},

	CLASS_NAME: "GeometricNet.Feature.Vector.Edge"
});


 
