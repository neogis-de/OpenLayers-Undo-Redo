/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Layer.Edge.js
 * Instance of OpenLayers.Layer.Edge are used to render the 
 * network edge features.
 *
 * Inherits from:
 * - <OpenLayers.Layer.Vector>
 */
GeometricNet.Layer.Vector.Edge = OpenLayers.Class(OpenLayers.Layer.Vector, {
	
	/**
	 * Constant: EVENT_TYPES
	 * {Array(String} Supported edge events
	 */
	EDGE_EVENT_TYPES: ["beforeedgeadded","edgeadded","beforeedgeremoved","edgeremoved",
		      "beforeedgemodified","edgemodified","afteredgemodified"],
	//EVENT_TYPES: [],
	/**
	 * Property: network
	 * {<GeometricNet.Network>} network of this edge layer	 
	 */
	network: null,

	/**
	 * APIProperty: node
	 * {<OpenLayers.Layer.Vector.Node>} Node layer of the network associated with
	 *		this edge.
	 */
	node: false,
	
	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,

	/** 
	 * APIProperty: maxFid
	 * {string}
	 * maximum of the edge fid at server, need to be fetch and 
	 * set at starting of application
	 */
	maxFid: "0",
	 
	/** 
	 * APIProperty: lastFid
	 * {string}
	 * last fid of the feature created 
	 */
	lastFid: "0",
	
	/** 
	 * Property: lastId
	 * {integer}
	 * last id, ie used to create unique fid with network.uidPrefix     
	 */
	lastId: 0,
	
	/**
	 * Property: removedFeatures
	 * {Array(<GeometricNet.Feature.Vector.Edge>)} 
	 * contains the removed features from the edge layer
	 */
	removedFeatures: [],	
	
	/**
	 * Constructor: OpenLayers.Layer.Vector.Edge
	 *
	 * Parameters:
	 * name - {String}
	 * node - {<OpenLayers.Layer.Vector.Node>} Node layer of the network
	 * options - {Object} Hashtable of extra options onto layer
	 */
	initialize: function(name,node, options) {
		//TODO concatenate events specific to vector with those from the base
		/*this.EVENT_TYPES = GeometricNet.Layer.Vector.Edge.prototype.EDGE_EVENT_TYPES;
           		GeometricNet.Layer.Vector.Edge.prototype.EDGE_EVENT_TYPES.concat(
            		OpenLayers.Layer.Vector.prototype.EVENT_TYPES
        	);*/
		if (options == undefined) { options = {}; }
		// Turn off error reporting, browsers like Safari may work
        // depending on the setup, and we don't want an unneccesary alert.
		// as done in OpenLayers also
        OpenLayers.Util.extend(options, {'reportError': false});
		var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
		//add edge specific evnets 
		for (var i=0;i<this.EDGE_EVENT_TYPES.length; i++){
			this.EVENT_TYPES.push(this.EDGE_EVENT_TYPES[i]);
			this.events.addEventType(this.EDGE_EVENT_TYPES[i]);
		}
			
		// set the node of network associated with this edge
		this.node = node;
		this.node.edge = this;					
		//TODO: it should be done with parameter in options object
		this.events.register("sketchcomplete",this,this.onSketchComplete);
		//TODO: it should be done with parameter in options object
		//this.events.register("beforefeatureadded",this,this.onBeforeFeatureAdded);
		this.events.register("beforefeaturesadded",this,this.onBeforeFeaturesAdded);
	},
	
	/**
	 * APIProperty: createUniqueFid
	 * Create a unique fid  for this layer
	 * Returns:
	 * {integer}
	 */
	createUniqueFid: function(){
		this.lastId = this.lastId + 1;
		var fid = "edge_"+this.network.uidPrefix+"_"+this.lastId;		
		return fid;
	}, 

	/**
	 * Method : onSketchComplete
	 * Function to be triggered on sketchecomplete event
	 */
	onSketchComplete: function(event) {
		/*if (!this.network.config.isTopology) {
			if (this.debug){
				console.log("Layer.Edge.js - onSketchComplete - adding feature without topology check");
			}
			//this.node.addFeatures([event.feature.attributes.startNode,event.feature.attributes.endNode]);		
			return true;
		} else {
			if (this.debug){
				console.log("Layer.Edge.js - onSketchComplete - considering feature add with topology check");
			}
			return this.considerToAdd(event.feature);
		}*/
		return this.considerToAdd(event.feature);
	},
	
	/**
	 * Method : onBeforeFeatureAdded
	 * Function to be triggered on beforefeatureadded event
	 */
	onBeforeFeatureAdded: function(event) {
		console.log("triggered event 'beforefeatureadded' on edge layer");
		if (!(event.feature instanceof GeometricNet.Feature.Vector.Edge)) {
			console.log("adopt this");
			if (event.feature instanceof OpenLayers.Feature.Vector){
				console.log("adopting this");
				event.feature = new GeometricNet.Feature.Vector.Edge(
						event.feature.geometry,event.feature.attributes,{fid:event.feature.fid,state:"Unknown"});
				console.log("event.feature.fid: " +event.feature.fid);
				event.feature.fid = 1000;
				console.log("changed event.feature.fid: " +event.feature.fid);
				return true;
			} else {
				return false;
			}
		}		
	},

	/**
	 * Method : onBeforeFeaturesAdded
	 * Function to be triggered on beforefeaturesadded event
	 */
	onBeforeFeaturesAdded: function(event) {
		//console.log("triggered event 'beforefeaturesadded' on edge layer");
		var edge;
		for(var i=0; i<event.features.length;i++){
			feature = event.features[i];
			if (!(feature instanceof GeometricNet.Feature.Vector.Edge)) {
				if (feature instanceof OpenLayers.Feature.Vector){					
					//TODO - create from edge constructor
					edge = new GeometricNet.Feature.Vector.Edge(
							feature.geometry,feature.attributes,{fid:feature.fid,state:"Unknown"});			
					event.features[i] = edge;		
				} else {
					event.features[i] = null;
				}
			}
		}		
	},

	
	/**
	 * Method : getFeaturesIntersected
	 * 		function to get intersected edge with the feature with in snapping tolrence
	 * Parameters: <OpenLayers.Geometry> 
	 * Returns: array of <OpenLayers.Feature.Vector> that intersects with given feature
	 */
	getFeaturesIntersected: function(geom) {
		var intersected=[];
		var newGeom ;
		if (geom instanceof OpenLayers.Geometry.Point) {
			if (this.network.config.isTopology) {
				// TODO: buffer should be function of geometry
				newGeom = this.node.buffer(geom,this.network.config.tolerance);
			} else {
				newGeom = geom;
			}
			//TODO: incorporate index
			for (var i=0;i<this.features.length ; i++)	{
				if (newGeom.intersects(this.features[i].geometry))	{
					intersected.push(this.features[i]);					
				}
			}
		} else if (geom instanceof OpenLayers.Geometry.LineString) {
			//TODO incorporate tolerance by buffer
			//TODO: incorporate index
			for (var i=0;i<this.features.length;i++){
				if (this.features[i].geometry.intersects(geom) ){
					intersected.push(this.features[i]);
				}
			}	
		} else {
			//TODO
		}		
		return intersected;
	}, 
	
	/**
	 * Method: considerSnap
	 *	Checks if given node false within the tolerance of exsting edges
	 * Input:
	 *	node - <OpenLayers.Feature.Vector.Node>
	 * Returns:
	 *	boolean
	 */
	considerSnap: function(node) {
		if (this.debug) {console.log("considering snapping with edge");}
		var intersectedEdges = this.getFeaturesIntersected(node.geometry);		
		if (this.debug) {console.log("Layer.Edge.js - considerSnap() - intersectedEdges: " + intersectedEdges.length); }
		if (intersectedEdges.length > 0) {
			var edgesSplit =[];
			var edgesDeleted = [];			
			for (var i=0;i<intersectedEdges.length ; i++ ) {
				if (this.debug) {console.log("Layer.Edge.js - considerSnap() - splitting the intersected edge id:" + intersectedEdges[i].fid ); }
				if ( node.canSnapToEdge(intersectedEdges[i]) ) {
					edgesSplit = intersectedEdges[i].splitWith(node);
					//this.addFeatures(edgesSplit);
					this.addEdgeFeatures(edgesSplit);
					//tag old edge to be removed
					edgesDeleted.push(intersectedEdges[i]);						
				} else {
					return false; //TODO - for many edges it would not work, it is checking only first edge 
				}
			}
			// remove old edges
			this.removeEdgeFeatures(edgesDeleted);
			return true;
		} else { 
			return false;
		}
		// TODO use options to return detail
	},

	/**
	 * Method: considerToAdd
	 */
	considerToAdd: function(edge){
		edge.layer = this;			
		//create the end nodes
		if (!this.createEndNodes(edge) ) {
			return false;
		}

		if (this.network.config.isSplitWithEdge){
	 		//check for intersection
	 		var intersections=[]; 		
	 		var newNodes=[];
	 		// split the existing edges if this edge intersects (but not on node)
	 		var intersectedOnNetwork = this.getIntersectedFromNetwork(edge.geometry);
	 		if(this.debug){
		 		console.log("Layer.Edge.js - getIntersectedFromNetwork()- edges intersected with the edge under consideration: " +intersectedOnNetwork.edges.length); 
	 		}
	 		if(this.debug && intersectedOnNetwork.edges.length > 0){
		 		//console.log("Layer.Edge.js - getIntersectedFromNetwork()- first intersection: " +intersectedOnNetwork.edges[0].intersections[0].toString()); 
	 		}
	 		for(var i=0;i<intersectedOnNetwork.edges.length;i++){
		 		for(var j=0;j<intersectedOnNetwork.edges[i].intersections.length;j++){
			 		var node = new GeometricNet.Feature.Vector.Node(
			 			intersectedOnNetwork.edges[i].intersections[j],{fid:this.node.createUniqueFid()});
			 		node.toState(OpenLayers.State.INSERT);
			 		if (this.node.considerToAdd(node)){
						newNodes.push(node);
					}
		 		}
	 		}
	 		//add new nodes to node layer
	 		this.node.addNodeFeatures(newNodes);		
	 		
	 		//remove end nodes of the edge under consideration from nodes intersected in network
	 		if(this.debug){
		 		console.log("Layer.Edge.js - getIntersectedFromNetwork()- total intersected existing nodes : " +intersectedOnNetwork.nodes.length); 		 		
	 		}
	 		OpenLayers.Util.removeItem(intersectedOnNetwork.nodes,this.node.getFeatureByFid(edge.attributes.startNode));
	 		OpenLayers.Util.removeItem(intersectedOnNetwork.nodes,this.node.getFeatureByFid(edge.attributes.endNode));
	 		if(this.debug){
		 		console.log("Layer.Edge.js - getIntersectedFromNetwork()- total intersected existing nodes, after removing end nodes or this edge : " +intersectedOnNetwork.nodes.length); 
	 		}
			
			//perform operation(split) with nodes intersected on this edge
			var newNodesOnEdge = newNodes.concat(intersectedOnNetwork.nodes);			
			if (newNodesOnEdge.length > 0 )	{
				splittedEdges =edge.splitWithNodes(newNodesOnEdge);
				this.addEdgeFeatures(splittedEdges);
				return false;
			} else {
				return true;
			}
		} else{
			return true;
		}
	},
	
	/**
	 * Method: getIntersectedFromNetwork
	 * get the features edge and nodes that intersec with given geometry also returns intersection points
	 * Parameters:
	 * geom - {<OpenLayers.Geometry>}
	 * Returns:
	 * {Object} - 
	 *   result = {edges:[{edge:edgeObject,intersections:[point1,point2..]},...],
	 				nodes:[node1,node2,...]}
	 */
	getIntersectedFromNetwork: function(geom) {
		var result={};
		result.edges =[];
		result.nodes =[];		
		if (geom instanceof OpenLayers.Geometry.LineString){
			//check for intersection			
			var intersectedEdges = [];			
			var nodesIntersectedOnEdge =[];						
			var intersections = [];
			
			intersectedEdges = this.getFeaturesIntersected(geom);	
			if (this.debug) {console.log("Layer.Edge.js - considerToAdd() - other edges intersected: "
										+ intersectedEdges.length )};
			for (var i=0;i< intersectedEdges.length;i++ ) {
				var nodesFound =[];
				var edgeDetail ={};	
				edgeDetail.intersections=[];
				var isEdgeToBeAdded = false;
				//result.edges.push({edge:inersectedEdges[i]});			
				
				//find intersections(points) with edge
				intersections = GeometricNet.Util.intersection(intersectedEdges[i].geometry,geom);
				if (this.debug) {console.log("Layer.Edge.js - considerToAdd() - edge_id: "
									+intersectedEdges[i].fid+" , no of intersections including at nodes: "
									+ intersections.length )};
				//get intersection point that are on edge only not on node
				for (var j=0; j <intersections.length; j++){
					nodesFound = this.node.getFeaturesIntersected(intersections[j],this.network.config.tolerance);
					if (this.debug) {
							console.log("Layer.Edge.js - getIntersectedFromNetwork()- nodesFound on edge: " +nodesFound.length); 
					}
					if (nodesFound.length == 0) {
						if (this.debug) {
							console.log("Layer.Edge.js - considerToAdd()- no node found so pushing this to intersectionsAtEdge");
						}	
						//intersectionsAtEdge.push(intersections[j]);
						edgeDetail.edge = intersectedEdges[i];
						edgeDetail.intersections.push(intersections[j]);
						isEdgeToBeAdded = true;
				//	} else if (nodesFound[0].fid==edge.attributes.startNode || nodesFound[0].fid==edge.attributes.endNode){
				//		if (this.debug) {
				//			console.log("Layer.Edge.js - considerToAdd()-  node found so doing nothing");
				//		}	
				//		//do nothing
					} else {
						if (this.debug) {
							console.log("Layer.Edge.js - considerToAdd()- node found so pushing this to nodesIntersectedOnEdge");
						}	
						nodesIntersectedOnEdge.push(nodesFound[0]);						
					}					
				}
				if (isEdgeToBeAdded) {result.edges.push(edgeDetail)};			
			}
			//remove duplicate nodes from nodesIntersectedOnEdge - in case of same node added that is on end of two edges
			result.nodes = GeometricNet.Util.removeDuplicate(nodesIntersectedOnEdge);
			return result;			
		}
	},

	/**
	 * Method: createEndNodes
	 *	create end nodes to the edge
	 * Input: 
	 *	edge - <GeometricNet.Feature.Vector.Edge>
	 * Returns:
	 * {boolean} - true if network condition satisfied
	 */
	createEndNodes: function(edge){
		var startPoint,endPoint;
		var startNode,endNode;
		if (edge.attributes.startNode == undefined)	{
			startPoint = edge.geometry.getVertices(true)[0];			
			nodeType = this.network.config.edgeLayer.edges[edge.attributes.edgeType].defaultStartNode;
			startNode = new GeometricNet.Feature.Vector.Node(startPoint,
							{nodeType:nodeType},{fid:this.node.createUniqueFid()});
			startNode.toState(OpenLayers.State.INSERT);
			startNode.layer = this.node; //TODO if can be done while creating a new node			
			edge.attributes.startNode = startNode.fid;
		}
		if (edge.attributes.endNode == undefined ) {
			endPoint = edge.geometry.getVertices(true)[1];
			nodeType = this.network.config.edgeLayer.edges[edge.attributes.edgeType].defaultEndNode;
			endNode = new GeometricNet.Feature.Vector.Node(endPoint,
						{nodeType:nodeType},{fid:this.node.createUniqueFid()});
			endNode.toState(OpenLayers.State.INSERT);
			endNode.layer = this.node; //TODO if can be done while creating a new node
			edge.attributes.endNode = endNode.fid;
		}
		if (this.network.config.isTopology) {
			var endNodes = [startNode,endNode];
			var nodesWithinTolerance = [];
			var isNodeSnapped;
			var nodesToAddNodeLayer = [];
			//check for startNode snap to existing node or edge			
			nodesWithinTolerance = this.node.getFeaturesIntersected(startNode.geometry); //TODO find the nearest node			
			if(nodesWithinTolerance.length>0){				
				if(edge.canSnapToNode(nodesWithinTolerance[0],0) ){					
					edge.snapToNode(nodesWithinTolerance[0],0);
				} else {
					return false;
				}
			} else {
				startNode.attributes.startEdges.push(edge.fid);
				nodesToAddNodeLayer.push(startNode);
				//consider snap with edge
				if (this.isOnEdge(startNode)){
					//if ( !this.considerSnap(startNode)) return false; 
					//TODO above statement should work
					if ( !this.considerNewEdgeSnap(edge,startNode,0)) return false;
				}
			}
			//check for endNode snap to existing node or edge
			nodesWithinTolerance = this.node.getFeaturesIntersected(endNode.geometry); //TODO find the nearest node
			if(nodesWithinTolerance.length>0){
				if(edge.canSnapToNode(nodesWithinTolerance[0],1) ){
					edge.snapToNode(nodesWithinTolerance[0],1);
				} else {
					return false;
				}
			} else {
				endNode.attributes.endEdges.push(edge.fid);
				nodesToAddNodeLayer.push(endNode);
				//consider snap with edge
				if (this.isOnEdge(endNode)){
					//if( !this.considerSnap(endNode)) return false;
					//TODO above statement should work
					if ( !this.considerNewEdgeSnap(edge,endNode,1)) return false;
				}
			}
			this.node.addNodeFeatures(nodesToAddNodeLayer);				
// 			for (var i=0;i<endNodes.length ;i++ ) {			
// 				nodesWithinTolerance = this.node.getFeaturesIntersected(endNodes[i].geometry,this.network.config.tolerance);
// 				if (this.debug){
// 					console.log("Layer.Edge.js - considerToAdd() - end node: "+endNodes[i].geometry 
// 								+", no of nodesWithinTolerance :" + nodesWithinTolerance.length);
// 				}
// 				//consider snapping of the edge to existing nodes
// 				if (nodesWithinTolerance.length > 0) {
// 					//TODO if intersected nodes > 1
// 					if (this.debug){
// 						console.log("Layer.Edge.js - considerToAdd() - end node: "+endNodes[i].geometry 
// 								+", no of nodesWithinTolerance :" + nodesWithinTolerance[0].fid);
// 					}
// 					edge.snapToNode(nodesWithinTolerance[0],i);
// 				} else {
// 					//consider to snapping of node in this layer				
// 					if (this.debug) {console.log("Layer.Edge.js - considerToAdd() - cosidering end nodes snapping to edge") };
// 					endNodeSnapped = this.considerSnap(endNodes[i]);
// 					if (this.debug){console.log("Layer.Edge.js - considerToAdd() - endNodeSnapped: "+endNodeSnapped)};
// 					if (i==0){
// 						//start node
// 						if (!endNodeSnapped) {
// 							endNodes[i].attributes.startEdges = [];
// 						}					
// 						endNodes[i].attributes.startEdges.push(edge.fid);
// 					}else {
// 						//end node
// 						if (!endNodeSnapped){
// 							endNodes[i].attributes.endEdges = [];
// 						}					
// 						endNodes[i].attributes.endEdges.push(edge.fid);
// 					}
// 					this.node.addFeatures(endNodes[i]);				
// 				}				
// 			}
		} else {
			this.node.addNodeFeatures([startNode,endNode]);
		}
		return true;					
	},

	/**
	 * Method: considerNewEdgeNodeSnap
	 *	Checks if given node false within the tolerance of exsting edges
	 * Input:	 
	 *	edge - {<OpenLayers.Feature.Vector.Edge>}
	 * nodeIndex - {integer} 0- for startNode , 1- for endNode
	 * Returns:
	 *	boolean
	 */
	considerNewEdgeSnap: function(edge,shootingNode,nodeIndex) {
		var intersectedEdges = this.getFeaturesIntersected(shootingNode.geometry);
		if (this.debug) {console.log("Layer.Edge.js - considerSnap() - intersectedEdges: " + intersectedEdges.length); }
		//TODO - should be done only for nearest edge, no need to check for all edges
		if (intersectedEdges.length > 0) {
			var edgesSplit =[];
			var edgesDeleted = [];			
			var shootingNodeStartEdgeCount = 0;
			var shootingNodeEndEdgeCount = 0;
			
			for (var i=0;i<intersectedEdges.length ; i++ ) {
				//count the edges at shooting node of edgge type of target edge
				var targetEdgeType = intersectedEdges[i].attributes.edgeType;
				if ( edge.attributes.edgeType == targetEdgeType ) {
					if (nodeIndex == 0 ){					
						shootingNodeStartEdgeCount = 1;
					} else if (nodeIndex == 1 ){
						shootingNodeEndEdgeCount = 1;
					}
				}				
				if (this.debug) {console.log("Layer.Edge.js - considerSnap() - splitting the intersected edge id:" + intersectedEdges[i].fid ); }
				if ( shootingNode.canSnapToEdge(intersectedEdges[i],
								shootingNodeStartEdgeCount,shootingNodeEndEdgeCount) )
				{
					edgesSplit = intersectedEdges[i].splitWith(shootingNode);
					// add edges, TODO: should be done by function Edge.addEdge(edge)
					this.addFeatures(edgesSplit);
					//tag old edge to be removed
					edgesDeleted.push(intersectedEdges[i]);						
				} else {
					return false; //TODO - for many edges it would not work, it is checking only first edge 
				}
			}
			// remove old edges TODO: should be done by function Edge.removeEdges(edges)				
			this.removeEdgeFeatures(edgesDeleted);
			return true;
		} else { 
			return true;
		}
		// TODO use options to return detail
	},
	
	/** 
	 * APIMethod: inOnEdge
	 * checks if the given node itersects with network edge
	 * Paramaeters:
	 * node - {<GeometricNet.Featrue.Vector.Node>}
	 * Returns:
	 * {boolean}
	 */
	isOnEdge: function(node) {
		var intersectedEdges = this.getFeaturesIntersected(node.geometry);		
		if (intersectedEdges.length > 0) {
			return true;
		} else {
			return false;
		}			
	},
	
	/**
	 * APIMethod: removeEdge
	 *  remove the edge feature from layer and reset the network association
	 * Input:
	 *  edge - {<GeometricNet.Feature.Vector.Edge>}
	 */
	removeEdge: function(edge) {
		if (this.network.config.isTopology) {
			startNode=this.node.getFeatureByFid(edge.attributes.startNode);
			this.node.updateNodeRemoveEdge(startNode,edge,0);
			
			endNode=this.node.getFeatureByFid(edge.attributes.endNode);
			this.node.updateNodeRemoveEdge(endNode,edge,1);
		}
		this.removeEdgeFeatures([edge]);
	},
	
	/** 
	 * APIMethod: addEdgeFeatures
	 * add edge features to the edge layer not to the network, to add in network use
	 * considerToAdd function
	 * Paramters:
	 * edges - {Array(<GeometricNet.Feature.Vector.edge>)}
	 */
	addEdgeFeatures: function(edges){
		if (!(edges instanceof Array)) {
			edges = [edges];
		}
		for(var i=0;i<edges.length;i++){
			this.events.triggerEvent("beforeedgeadded",{feature:edges[i]});
			this.addFeatures(edges[i]);
			this.events.triggerEvent("edgeadded",{feature:edges[i]});
		}
	},
	
	/** 
	 * Method: removeEdgeFeatures
	 * remove edge features from the edge layer, does not remove from the network properly,
	 * to remove from  network use removeEdge function
	 * Paramters:
	 * edges - {Array(<GeometricNet.Feature.Vector.edge>)}
	 */
	removeEdgeFeatures: function(edges){
		if (!(edges instanceof Array)) {
			edges = [edges];
		}
		for(var i=0;i<edges.length;i++){
			this.events.triggerEvent("beforeedgeremoved",{feature:edges[i]});
			edges[i].state="Delete";
			this.removedFeatures.push(edges[i]);
			this.removeFeatures(edges[i]);
			this.events.triggerEvent("edgeremoved",{feature:edges[i]});
		}
	},

	/** 
	 * APIMethod: updateEdge
	 * update edge attributes
	 * Paramters:
	 * edge - {<GeometricNet.Feature.Vector.edge>}
	 * options - {Object} properties of this object would be used to update the edge 
	 * valid Option Properties:
	 * geometry - {<OpenLayers.Geometry.LineString>}
	 * attributes - {Object} set of all attributes, replace the whole attributes object
	 * attribute - {Object} single field name and value 
	 *  like  -{name:"name of field",value:"value of field"}	   
	 */
	updateEdge: function(edge,options){
		this.events.triggerEvent("beforeedgemodified",{feature:edge});
		if(options.hasOwnProperty("geometry")){
			edge.geometry = options.geometry;
		}
		if(options.hasOwnProperty("attributes")){
			edge.attributes = options.attributes;
		}
		if(options.hasOwnProperty("attribute")){
			if(edge.attributes.hasOwnProperty(options.attribute.name)){
				edge.attributes[options.attribute.name] = options.attribute.value;
			}
		}
		this.events.triggerEvent("afteredgemodified",{feature:edge});
	},

	/**
	 * Method: onNodeMove
	 * trigger the event on featuremodified
	 * Parameters:
	 * node - {<GeometricNet.Feature.Vector.Node>}
	 */
	onNodeMove: function(edge) {
		//node can be utilised later
		this.events.triggerEvent("featuremodified",{feature:edge});
		//TODO: shall I retrun true here
	},	

    CLASS_NAME: "GeometricNet.Layer.Vector.Edge"
});
