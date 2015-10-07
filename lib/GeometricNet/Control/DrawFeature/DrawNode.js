/**
 * @requires OpenLayers/Control/DrawFeature.js
 * @requires OpenLayers/Feature/Vector/Node.js
 */

/**
 * Class: OpenLayers.Control.DrawFeature.DrawNode
 * The DrawNode control draws node features on a Node 
 * layer when active.
 *
 * Inherits from:
 *  - <OpenLayers.Control.DrwaFeature>
 */
GeometricNet.Control.DrawFeature.DrawNode = OpenLayers.Class(OpenLayers.Control.DrawFeature, {
    
	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,
	/**
	 * Property: nodeType
	 * {string}
	 * type of the node to draw
	 */
	nodeType: null,

    /**
     * Constructor: OpenLayers.Control.DrawFeature.DrawNode
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector.Node>} 
     * handler - {<OpenLayers.Handler>} 
     * options - {Object} 
     */
    initialize: function(layer, handler, options) {
		if (options == undefined ){options = {};}
        var newArguments = [];
		newArguments.push(layer,handler,options);
        OpenLayers.Control.DrawFeature.prototype.initialize.apply(this,newArguments);
        if (options.nodeType){
	        this.nodeType=options.nodeType;
        }        
    },

    /**
     * Method: drawFeature
     */
    drawFeature: function(geometry) {
		if (this.debug) {
			console.log("DrawNode.js - drawFeature debug true" );
			//geometry = new OpenLayers.Geometry.Point(8,8);
		}
		var attributes = {nodeType:this.nodeType};
		var options = {fid : this.layer.createUniqueFid()};
        var feature = new GeometricNet.Feature.Vector.Node(geometry,attributes,options);
        //feature.attributes.nodeType = this.nodeType;
        var proceed = this.layer.events.triggerEvent(
            "sketchcomplete", {feature: feature}
        );
        if(proceed !== false) {
            feature.state = OpenLayers.State.INSERT;
            this.layer.addFeatures([feature]);
            this.featureAdded(feature);
            this.events.triggerEvent("featureadded",{feature : feature});            
        }
    },

    CLASS_NAME: "GeometricNet.Control.DrawFeature.DrawNode"
});
