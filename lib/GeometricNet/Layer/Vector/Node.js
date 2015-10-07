/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Layer.Node.js
 * Instance of OpenLayers.Layer.Node are used to render the 
 * network node features.
 *
 * Inherits from:
 * - <OpenLayers.Layer.Vector>
 */
GeometricNet.Layer.Vector.Node = OpenLayers.Class(OpenLayers.Layer.Vector, {
	/**
	 * Constant: EVENT_TYPES
	 * {Array(String} Supported node events
	 */
	NODE_EVENT_TYPES: ["beforenodeadded","nodeadded","beforenoderemoved","noderemoved",
		      "beforenodemodified","nodemodified","afternodemodified"],
	//EVENT_TYPES: [],
	/**
	 * Property: network
	 * {<GeometricNet.Network>} network of this node layer	 
	 */
	network: null,

	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,

	/**
	 * APIProperty: edge
	 * {OpenLayers.Layer.Vector.Edge} Edge layer of the network associated with
	 *		this node.
	 */
	edge: null,

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
	 * Property: removedFeatures
	 * {Array(<GeometricNet.Feature.Vector.Node>)} 
	 * contains the removed features from the node layer
	 */
	removedFeatures: [],
	
	/** 
	 * Property: lastId
	 * {integer}
	 * last id, ie used to create unique fid with network.uidPrefix     
	 */
	lastId: 0,
	
	/**
	 * Constructor: OpenLayers.Layer.Vector.Node
	 *
	 * Parameters:
	 * name - {String}
	 * options - {Object} Hashtable of extra options onto layer
	 */
	initialize: function(name, options) {
		if (options == undefined) { options = {}; }
		this.network = options.network ? options.network : null;
		// Turn off error reporting, browsers like Safari may work
        // depending on the setup, and we don't want an unneccesary alert.
		// as done in OpenLayers also
        OpenLayers.Util.extend(options, {'reportError': false});
		var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
		//add node specific evnets 
		for (var i=0;i<this.NODE_EVENT_TYPES.length; i++){
			this.EVENT_TYPES.push(this.NODE_EVENT_TYPES[i]);
			this.events.addEventType(this.NODE_EVENT_TYPES[i]);
		}
		// set the edge of network associated with this node
		if (options.edge != undefined)	{		
			this.edge = options.edge;			
		}
		//TODO: it should be done with parameter in options object
		this.events.register("sketchcomplete",this,this.onSketchComplete);
		this.events.register("beforefeaturesadded",this,this.onBeforeFeaturesAdded);
		this.events.register("vertexmodified",this,this.onVertexModified);
		this.events.register("featuremodified",this,this.onFeatureModified);
		//set maxFid and lastfid
		//this.network.getMaxFid("node"); //TODO this should be part of this layer not network				
	},	

	/**
	 * APIProperty: createUniqueFid
	 * Create a unique fid  for this layer
	 * Returns:
	 * {integer}
	 */
	createUniqueFid: function(){
		this.lastId = this.lastId + 1;
		var fid = "node_"+this.network.uidPrefix+"_"+this.lastId;		
		return fid;
	}, 

	/**
	 * Method : onBeforeFeaturesAdded
	 * Function to be triggered on beforefeaturesadded event
	 */
	onBeforeFeaturesAdded: function(event) { 
		//console.log("triggered event 'beforefeaturesadded' on edge layer");
		var node;
		for(var i=0; i<event.features.length;i++){
			feature = event.features[i];
			if (!(feature instanceof GeometricNet.Feature.Vector.Node)) {
				if (feature instanceof OpenLayers.Feature.Vector){					
					//TODO - create from edge constructor
					node = new GeometricNet.Feature.Vector.Node(
							feature.geometry,feature.attributes,{fid:feature.fid,state:"Unknown"});					
					event.features[i] = node;		
				} else {
					event.features[i] = null;
				}
			}
		}		
	},

	
	/**
	 * Method : getFeaturesIntersected
	 * 		function to get intersected edge with the feature with in snapping tolrence
	 * TODO - this funtion must be part of vector
	 * Parameters: <OpenLayers.Geometry> 
	 * Returns: array of <OpenLayers.Feature.Vector.Node> that intersects with given feature
	 */
	getFeaturesIntersected: function(geom) {
		var newGeom;
		var intersected =[];
		if (geom instanceof OpenLayers.Geometry.Point) {
			// check if topolgyCheck is true
			if (this.network.config.isTopology) {
				newGeom = this.buffer(geom,this.network.config.tolerance);				
			} else {
				newGeom = geom;
			}
		} else if(geom instanceof OpenLayers.Geometry.Polygon) {			
			newGeom = geom;
		} else {
			//TODO geom LineString , check within tolerance
		}
// 		if (this.network.config.isTopology) {
// 			if (geom instanceof OpenLayers.Geometry.Point) {
// 				newGeom = this.buffer(geom,this.network.config.tolerance);
// 			} else if(geom instanceof OpenLayers.Geometry.LineString) {
// 				//TODO
// 			} 
// 		} else {
// 			newGeom = geom;
// 		}		
		for (var i=0;i<this.features.length ; i++)	{
			if (newGeom.intersects(this.features[i].geometry))	{
				intersected.push(this.features[i]);
			}
		}
		return intersected;
	},    

	/**
	 * Method : setEdge
	 * function to set the associated edge for this node layer
	 */
	setEdge: function(edge) {
		this.edge = edge;
	},

	/**
	 * Method : onVertexModified
	 * Function to be triggered on  event
	 */
	onVertexModified: function(event) {
		this.onNodeMove(event.feature);		
		//TODO: shall I retrun true here
	},	
	
	/**
	 * Method: onBeforeFeatureModified
	 * Function to be triggered on event "beforefeaturemodified"
	 */
	onBeforeFeatureModified: function(event){
		var node=event.feature;
		this.events.triggerEvent("beforenodemodified",{feature:node});
		var edges = node.getStartEdges();
		edges  = edges.concat(node.getEndEdges());
		for (var i=0;i<edges.length;i++){
			this.network.edge.events.triggerEvent("beforefeaturemodified",{feature:edges[i]});
			this.network.edge.events.triggerEvent("beforeedgemodified",{feature:edges[i]});
		}
		return true;
	},	

	/**
	 * Method: onFeatureModified
	 * Function to be triggered on event "featuremodified"
	 */
	onFeatureModified: function(event) {
		var node = event.feature;
		this.events.triggerEvent("nodemodified",{feature:node});
		var edges = node.getStartEdges();
		edges  = edges.concat(node.getEndEdges());
		for (var i=0;i<edges.length;i++){
			this.network.edge.events.triggerEvent("featuremodified",{feature:edges[i]});
			this.network.edge.events.triggerEvent("edgemodified",{feature:edges[i]});
			//this.network.edge.onNodeMove(edges[i]);
		}
		return true;
	},
	
	/**
	 * Method : onSketchComplete
	 * Function to be triggered on sketchcomplete event
	 */
	onSketchComplete: function(event) {
		if (this.debug) {
			console.log("Node.js - onSketchComplete - event triggered and geom:" + event.feature.geometry);
			console.log("Node.js - onSketchComplete - node.fid:" + event.feature.fid);
		}
		//check if topolgy is false or true
		if (!this.network.config.isTopology) {
			return true;
		} else { // i.e. topolgy need to be checked for node and edge
			// check if intersects with existing node/edge within tolerance
			//return this.considerToAdd(event.feature);
			//always add node, TODO - but should be done with above line only
			// TODO - not by force
			return this.considerToAdd(event.feature);
			//return true;
		}
	},	

	/**
	 * Method: considerToAdd
	 *	method to add node to layer checks node snap and edge snap/split
	 * Parameters:
	 *	node -  <OpenLayers.Feature.Vector.Node>
	 * Returns:
	 *	{boolean}
	 */
	considerToAdd: function(node,options) {
		if (this.debug) { console.log("Layer.Node.js - considerToAdd - started"); }
		var result=true;
		// check if intersects with existing node within tolerance
		var nodeSnap = this.considerSnap(node,{details:true});
		if (nodeSnap) {
			result = false;
// 			if (options != undefined ) {
// 				if (options.detail ==true )	{
// 					result = intersectedNodes;
// 				}
// 			} else {
// 				console.log("Layer.Node.js - considerToAdd - not adding the node as found near by node"); 
// 				result = false;
// 			}
		} else { 
			// check if intersects with edge within tolerance
			if (this.debug)	{
				console.log("Layer.Node.js - considerToAdd - considering for edge snap");
			}
			if (this.edge.isOnEdge(node)){
				if (this.debug) { console.log("node is on edge so sending to edge.considerSnap");}			
				result = this.edge.considerSnap(node);
			} else {
				if (this.debug) { console.log("node is not on edge");}			
			}
		}
		return result;
	},

	/**
	 * Method: considerSnap
	 *	Checks if given node false within the tolerance of exsting nodes
	 * Input:
	 *	node - <OpenLayers.Feature.Vector.Node>
	 * Returns:
	 *	boolean
	 */
	considerSnap: function(node,options) {
		var intersectedNodes = this.getFeaturesIntersected(node.geometry);
		var result;
		if (intersectedNodes.length > 0) {				
			if (options != undefined ) {
				if (options.details ==true )	{
					result = intersectedNodes;
				}
			} else {
				result = true;
			}
		} else { 
			result = false;
		}
		// TODO use options to return detail
		return result;
	},

	/**
	 * Method : onEventSnap
	 * Function to be triggered on snap event
	 */
	onEventSnap: function(event) {
		if (this.debug) {
			console.log("Node.js - onEventSnap - event triggered and event:" + event);
		}
	},

	/**
	 * Method : onEventBeforeFeatureAdded
	 * Function to be triggered on beforeFeatureAdded event
	 */
	onEventBeforeFeatureAdded: function(event) {
		if (this.debug) {			
			console.log("Node.js - onEventBeforeFeatureAdded - node.fid:" + event.feature.fid);
		}
		//this.edge.splitEdge(event.feature);
		return true;
	},	

	/**
	 * Method : onEventFeatureAdded
	 * Function to be triggered on featureAdded event
	 */
	onEventFeatureAdded: function(event) {
		if (this.debug) {			
			console.log("Node.js - onEventFeatureAdded - node.fid:" + event.feature.fid);
		}
	},	
	
	/**
	 * Method: buffer
	 *	to buffer any geometry 
	 *	TODO : must be part of geometry
	 * Parameter: 
	 *	geom - {OpenLayers.Geometry}
	 *	distance - {float}, distance to create buffer
	 * Returns: <OpenLayers.Geometry.Polygon>
	 */
	buffer: function(geom,distance) {
		var bound,newGeom;
		if (geom instanceof OpenLayers.Geometry.Point) {
			//TODO: instease of creating rectangle, create buffer polygon
			var x,y,left,bottom,right,top;
			left = geom.x - distance;
			bottom = geom.y - distance;
			right = geom.x + distance;
			top = geom.y + distance;
			bound = new OpenLayers.Bounds(left,bottom,right,top);
			newGeom = bound.toGeometry();
		} else {
			//TODO for linestring and polygon
		}
		return newGeom;
	},
	
	/** 
	 * APIMethod: findNearestNode
	 * find the nearest node to the the given point
	 * Parameters:
	 * point - {OpenLayers.Geometry.Point}
	 * Returns:
	 * nodes - array of GeometricNet.Feature.Vector.Node
	 */
	findNearestNode: function(point,distance) {
		var searchBox = this.buffer(point,distance);
		if(this.debug){ 
			console.log("Layer.Node.js - findNearestNode - searchbox: " + searchBox.toString());
		}		
		var nodes = this.getFeaturesIntersected(searchBox);
		var leastDist = Number.POSITIVE_INFINITY;
		var dist,nearest;
 		if (nodes){
	 		if(this.debug){ 
				console.log("Layer.Node.js - findNearestNode - near nodes number : " + nodes.length);
			}	 			
 			for(var i=0;i<nodes.length;i++) {
				dist = point.distanceTo(nodes[i].geometry);				
				if (dist < leastDist){				
					leastDist = dist;					
					nearest = nodes[i];
 				}
 			}
			if(this.debug){ 
				console.log("Layer.Node.js - findNearestNode - nearest Node : " + nearest.fid);
			}		 			
 			return nearest; 			
 		} else {
 			return false;
 		}				
	},
	
	/**
	 * Method: removeNode
	 *  remove the node feature from layer and reset the network association
	 * Input:
	 *  node - <GeometricNet.Feature.Vector.Node>
	 */
	removeNode: function(node) {
		if (this.network.config.isTopology) {
			startEdges = node.getStartEdges();
			if(startEdges.length > 0){
				for (var i=0;i<startEdges.length;i++ ) {
					endNode = startEdges[i].getEndNode();
					this.updateNodeRemoveEdge(endNode,startEdges[i],1);
					this.edge.removeEdgeFeatures(startEdges[i]);
				}
			}
			endEdges = node.getEndEdges();
			if (endEdges.length > 0){
				for (var i=0;i<endEdges.length;i++ ) {
					startNode = endEdges[i].getStartNode();
					this.updateNodeRemoveEdge(startNode,endEdges[i],0);
					this.edge.removeEdgeFeatures(endEdges[i]);
				}
			}
		}
		this.removeNodeFeatures([node]);
	},

    /** 
     * APIMethod: addNodeFeatures
     * add node features to the node layer not to the network, to add in network use
     * considerToAdd function
     * Paramters:
     * nodes - {Array(<GeometricNet.Feature.Vector.node>)}
     */
    addNodeFeatures: function(nodes){
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }
        for(var i=0;i<nodes.length;i++){
            this.events.triggerEvent("beforenodeadded",{feature:nodes[i]});
            this.addFeatures(nodes[i]);
            this.events.triggerEvent("nodeadded",{feature:nodes[i]});
        }
    },

	/** 
	 * Method: removeNodeFeatures
	 * remove node features from the node layer, does not remove from the network properly,
	 * to remove from  network use removeNode function
	 * Paramters:
	 * nodes - Array({<GeometricNet.Feature.Vector.node>})
	 */
	removeNodeFeatures: function(nodes){
		if (!(nodes instanceof Array)) {
			nodes = [nodes];
		}
        for(var i=0;i<nodes.length;i++){
			this.events.triggerEvent("beforenoderemoved",{feature:nodes[i]});
			nodes[i].state = "Delete";
			this.removedFeatures.push(nodes[i]);
			this.removeFeatures(nodes[i]);
			this.events.triggerEvent("noderemoved",{feature:nodes[i]});
		}
	},

	/** 
	 * APIMethod: updateNode
	 * update node attributes
	 * Paramters:
	 * node - {<GeometricNet.Feature.Vector.node>}
	 * options - {Object} properties of this object would be used to update the node 
	 * valid Option Properties:
	 * geometry - {<OpenLayers.Geometry.LineString>}
	 * attributes - {Object} set of all attributes, replace the whole attributes object
	 * attribute - {Object} single field name and value 
	 *  like  -{name:"name of field",value:"value of field"}	   
	 */
	updateNode: function(node,options){
		this.events.triggerEvent("beforenodemodified",{feature:node});
		if(options.hasOwnProperty("geometry")){
			node.geometry = options.geometry;
		}
		if(options.hasOwnProperty("attributes")){
			node.attributes = options.attributes;
		}
		if(options.hasOwnProperty("attribute")){
			if(node.attributes.hasOwnProperty(options.attribute.name)){
				node.attributes[options.attribute.name] = options.attribute.value;
			}
		}
		this.events.triggerEvent("afternodemodified",{feature:node});
	},

	/** 
	 * Method: updateNodeAddEdge
	 * add the edge to node attributes, do not use to add to network
	 * Parameters:
	 * node - {<GeometricNet.Feature.Vector.Node>}
	 * edge - {<GeometricNet.Feature.Vector.Edge>}
	 * index - {integer} 0 for start edge 1 for edd edge
	 */
	updateNodeAddEdge: function(node,edge,index){
		this.events.triggerEvent("beforenodemodified",{feature:node});
		node.addEdge(edge.fid,index);
		node.toState(OpenLayers.State.UPDATE);
		this.events.triggerEvent("afternodemodified",{feature:node});				
	},	 

	/** 
	 * Method: updateNodeRemoveEdge
	 * remove the edge from node attributes, do not use to remove from network
	 * Parameters:
	 * node - {<GeometricNet.Feature.Vector.Node>}
	 * edge - {<GeometricNet.Feature.Vector.Edge>}
	 * index - {integer} 0 for start edge 1 for edd edge
	 */
	updateNodeRemoveEdge: function(node,edge,index){
		this.events.triggerEvent("beforenodemodified",{feature:node});
		node.removeEdge(edge.fid,index);
		node.toState(OpenLayers.State.UPDATE);
		this.events.triggerEvent("afternodemodified",{feature:node});				
	},	 
	/**
	 * Method: onNodeMove
	 *  move the associated edges to this node
	 * Input:
	 * node - {<GeometricNet.Feature.Vector.Node>}
	 */
	onNodeMove: function(node){		
		var startEdges = node.getStartEdges();
		if (startEdges.length>0){
			this.network.edge.eraseFeatures(startEdges);
			for (var i=0;i<startEdges.length;i++){
				startEdges[i].snapToNode(node,0);
				startEdges[i].toState("Update");
				this.network.edge.drawFeature(startEdges[i]);
				//this.network.edge.onNodeMove(startEdges[i]);
			}
		}
		var endEdges = node.getEndEdges();
		if (endEdges.length > 0){			
			this.network.edge.eraseFeatures(endEdges);		
			for (var i=0;i<endEdges.length;i++){
				endEdges[i].snapToNode(node,1);
				endEdges[i].toState("Update");
				this.network.edge.drawFeature(endEdges[i]);
				//this.network.edge.onNodeMove(endEdges[i]);
			}
		}
		//this.network.edge.redraw();
		return true;
	},
	
	CLASS_NAME: "GeometricNet.Layer.Vector.Node"
});
