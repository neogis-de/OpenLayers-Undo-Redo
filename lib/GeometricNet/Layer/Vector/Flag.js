/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: GeometricNet.Layer.Vector.Flag
 * Instance of GeometricNet.Layer.Vector.Flag is used to 
 * render the flag features like start point, end point , blocks etc
 *
 * Inherits from:
 * - <OpenLayers.Layer.Vector>
 */ 
GeometricNet.Layer.Vector.Flag = OpenLayers.Class(OpenLayers.Layer.Vector, {

	/**
	 * APIProperty: graph
	 * {GeometricNet.Graph} graph of network
	 */
	graph: null,
	
	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,
	
	/**
	 * Constructor: OpenLayers.Layer.Vector.Edge
	 *
	 * Parameters:
	 * graph - {OpenLayers.Layer.Vector.Node} Node layer of the network
	 * options - {Object} Hashtable of extra options onto layer
	 */
	initialize: function(name,graph, options) {
		this.graph = graph;
		if (options == undefined) { options = {}; }
		var symbolizer,styleMap;
		if (options.styleMap == undefined) {
			options.styleMap =new OpenLayers.StyleMap({pointRadius: 10, fillColor: "red",
				fillOpacity: 0.7, strokeColor: "black"});
		}
		var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
        
		//TODO: it should be done with parameter in options object
		this.events.on({ "sketchcomplete" : this.onSketchComplete,
						 "featureadded" : this.onFeatureAdded,
						 "scope": this });
		//TODO: it should be done with parameter in options object
		/*this.events.register("featureadded",
								this,
								this.onFeatureAdded
							);      */
		
	},
	/**
	 * Method : onSketchComplete
	 * Function to be triggered on sketchecomplete event
	 */
	onSketchComplete: function(event) {
		var node = this.graph.node.findNearestNode(event.feature.geometry,200);		
		if (node) {			
			event.feature.geometry = node.geometry;
 			return true;
 		} else {
 			return false;
 		}		
	},
	
	
	/**
	 * Method: onFeatureAdded
	 * function to be triggered on featureadded event
	 */
	onFeatureAdded: function(event) {		
		var count = this.features.length;
		var startNode,endNode;
		if (count > 1){
			//console.log("finding shortest path");
			startNode = this.graph.node.findNearestNode(this.features[count-2].geometry,100);
			endNode = this.graph.node.findNearestNode(this.features[count-1].geometry,100);
			selectCtrl = new OpenLayers.Control.SelectFeature(this.graph.edge);
			path_nodes = this.graph.aStarSearch(startNode,endNode);
			path_edges = this.graph.getPathEdges(path_nodes);
			selectCtrl.unselectAll();
			for(var i=0;i<path_edges.length;i++) {
				selectCtrl.select(path_edges[i]);
				//selectCtrl.select(path_nodes[i]);
			}
			if(count > 2){
				this.removeFeatures(this.features[0]);		
			}
		}
	}, 

	CLASS_NAME: "GeometricNet.Layer.Vector.Flag"
});