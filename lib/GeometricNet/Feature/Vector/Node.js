/**
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Feature.Vector.Node
 * class to represent the edge feture of network
 * Inherits from:
 * - <OpenLayers.Feature.Vector>
 */

GeometricNet.Feature.Vector.Node = OpenLayers.Class(OpenLayers.Feature.Vector, {
	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,
	/**
	 * APIProperty: nodeType
	 * {string}
	 * node type of the network
	 */
	//nodeType: null, part of attributes

	/**
	 * Constructor: OpenLayers.Feature.Vector.Node
	 *
	 * Parameters:
	 * point - {OpenLayers.Geometry.Point}
	 * attributes - attributes of the node feature 	 
	 * options - {Object} Hashtable of extra options 
	 * Valid Options:
	 *	
	 */
	initialize: function(point, attributes,options) {
		options = options ? options : {};
		if (point instanceof OpenLayers.Geometry.Point) {
			attributes = attributes ? attributes : {};
			attributes.startEdges = attributes.startEdges ? attributes.startEdges : [];
			attributes.endEdges = attributes.endEdges ? attributes.endEdges : [];
			//pass to vector 
			var newArguments = [];
	        newArguments.push(point,attributes);
			OpenLayers.Feature.Vector.prototype.initialize.apply(this,newArguments);
			//this.fid = options.fid ? options.fid : null;
			for(option in options){
				this[option] = options[option];
			}
			if (this.debug)	{ 
				console.log("Feature.Vector.Node.js - initialize - node.attributes.startEdges: "+ this.fid);
			}

		} else {
			//TODO send error message
			return null;
		}		
	},
	
	/** 
	 * APIMethod: getEdgeCount
	 * returns the count of edges for given edgeType
	 * Parameters:
	 * edgeType - {string} 
	 * direction - {integer} 0 - startEdges, 1 - endEdges
	 * Returns:
	 * {integer}
	 */
	getEdgeCount: function(edgeType,direction) {		
		var count=0;
		var edges=[];
		var edge;
		if (direction == 0) {
			edges = this.attributes.startEdges; 
		} else if (direction == 1) {
			edges = this.attributes.endEdges; 
		} else {
			return "msg"; //TODO
		}		
		for (var i=0;i< edges.length;i++){
			edge = this.layer.edge.getFeatureByFid(edges[i]);			
			if (edgeType == edge.attributes.edgeType) count++;
		}
		return count;
	},
	
	/**
	 * APIMethod: canSnapToEdge
	 * check whether this node can snap to edge as per the network rules
	 * Parameters: 
	 * edge - {<GeometricNet.Feature.Vector.Edge>} , the edge to be checked	 
	 * TODO as node,edge association is with id, not with object itself,
	 * TODO so could not get the edge count
	 * shootingNodeStartEdgeCount - {integer} TODO - to be removed
	 * shootingNodeEndEdgeCount - {integer} TODO - to be removed
	 * Returns:
	 * {boolean} - true in case this node can snap to edge, false otherwise
	 */
	canSnapToEdge: function(edge,shootingNodeStartEdgeCount,shootingNodeEndEdgeCount) {
		//var nodeDetail = this.layer.network.nodesDetail[this.attributes.nodeType];
		//TODO - above statement should work this.layer is undefined
		var nodeDetail = edge.layer.network.config.nodeLayer.nodes[this.attributes.nodeType];
		if (shootingNodeStartEdgeCount == undefined){
			 shootingNodeStartEdgeCount = this.getEdgeCount(edge.attributes.edgeType,0);
		}
		if (shootingNodeEndEdgeCount == undefined){
			shootingNodeEndEdgeCount =this.getEdgeCount(edge.attributes.edgeType,1);
		}		
		if ( nodeDetail.startEdges.hasOwnProperty(edge.attributes.edgeType) 
			 && nodeDetail.endEdges.hasOwnProperty(edge.attributes.edgeType) ) 
		{
			if(shootingNodeStartEdgeCount < nodeDetail.startEdges[edge.attributes.edgeType].maxCount 
				&& shootingNodeEndEdgeCount < nodeDetail.endEdges[edge.attributes.edgeType].maxCount ) 
			{
				return true;
			} 
		}
		return false;
	},
	
	/**
	 * APIMethod: getStartEdges
	 * Retruns the start edges from this node 
	 * Returns: array of {<GeometricNet.Vector.Feature.Edge>}
	 */
	getStartEdges: function(){
		var edges=[];
		for(var i=0;i<this.attributes.startEdges.length;i++){
			edges.push(this.layer.network.edge.getFeatureByFid(this.attributes.startEdges[i]));
		}
		return edges;
	},	

	/**
	 * APIMethod: getEndEdges
	 * Retruns the end edges from this node 
	 * Returns: array of {<GeometricNet.Vector.Feature.Edge>}
	 */
	getEndEdges: function(){
		var edges=[];
		for(var i=0;i<this.attributes.endEdges.length;i++){
			edges.push(this.layer.network.edge.getFeatureByFid(this.attributes.endEdges[i]));
		}
		return edges;
	},
	
	/**
	 * APIMethod: removeEdge
	 * Remove the  edge from the node attributes, 0 - start edge and 1 for end edge
	 * Parameter: 
	 * edgeFid - {string}
	 * index - {integer} 0 for start edge and 1 for end edge
	 */
	removeEdge: function(edgeFid,index){
		if (index == undefined){ index=0;} 
		if (index == 0) {
			OpenLayers.Util.removeItem(this.attributes.startEdges,edgeFid);	
		} else if (index ==1) {
			OpenLayers.Util.removeItem(this.attributes.endEdges,edgeFid);	
		}
	},
	
	/**
	 * APIMethod: addEdge
	 * Parameter: 
	 * edgeFid - {string}
	 * index - {integer} 0 for start edge and 1 for end edge
	 */
	addEdge: function(edgeFid,index){
		if (index == undefined){ index=0;} 
		if (index == 0) {
			this.attributes.startEdges.push(edgeFid);	
		} else if (index ==1) {
			this.attributes.endEdges.push(edgeFid);	
		}
	},

	/**
	 * APIMethod: canNodeSnapToEdge
	 * check whether this node can snap to edge as per the network rules
	 * TODO - this is copy of Feature.Vector.Node.canSnapToEdge, 
	 * TODO as node,edge association is with id, not with object itself,
	 * TODO so could not get the edge count
	 * Parameters: 	 
	 * shootingEdge - {<GeometricNet.Feature.Vector.Edge>} 	 
	 * shootingNodeStartEdgesCount - {integer} - TODO edges count for target edgeType
	 * shootingNodeEndEdgesCount - {integer} - TODO edges count for target edgeType
	 * targetEdge - {<GeometricNet.Feature.Vector.Edge>}
	 * Returns:
	 * {boolean} - true in case this edge can snap to edge, false otherwise
	 */
	canNodeSnapToEdge: function(targetEdge,shootingNodeStartEdgesCount,shootingNodeEndEdgesCount) {
		var nodeDetail = this.layer.network.nodesDetail[this.attribute.nodeType];				
		if ( nodeDetail.startEdges.hasOwnProperty(targetEdge.attributes.edgeType) 
			 && nodeDetail.endEdges.hasOwnProperty(targetEdge.attributes.edgeType) ) 
		{
			if(shootingNodeStartEdgesCount  < nodeDetail.startEdges[edge.attributes.edgeType].maxCount 
				&& shootingNodeEndEdgesCount < nodeDetail.endEdges[edge.attributes.edgeType].maxCount ) 
			{
				return true;
			} 
		}
		return false;
	},
	

	CLASS_NAME: "GeometricNet.Feature.Vector.Node"
});
