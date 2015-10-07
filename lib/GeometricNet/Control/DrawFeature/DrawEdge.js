/**
 * @requires OpenLayers/Control/DrawFeature.js
 * @requires OpenLayers/Feature/Vector/Edge.js
 */

/**
 * Class: OpenLayers.Control.DrawFeature.DrawEdge
 * The DrawEdge control draws edge features on a Edge 
 * layer when active.
 *
 * Inherits from:
 *  - <OpenLayers.Control.DrwaFeature>
 */
GeometricNet.Control.DrawFeature.DrawEdge = OpenLayers.Class(OpenLayers.Control.DrawFeature, {
    
	/**
	 * Property: debug
	 * used to debug 
	 */
	debug: false,
	/**
	 * Property: edgeType
	 * {string}
	 * type of the edge to draw
	 */
	edgeType: null,

    /**
     * Constructor: OpenLayers.Control.DrawFeature.DrawEdge
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector.Edge>} 
     * handler - {<OpenLayers.Handler>} 
     * options - {Object} 
     */
    initialize: function(layer, handler, options) {
        if (options == undefined ){options = {};}
        var newArguments = [];
		newArguments.push(layer,handler,options);
        OpenLayers.Control.DrawFeature.prototype.initialize.apply(this,newArguments);
        if (options.edgeType){
	        this.edgeType=options.edgeType;
        }        
    },

    /**
     * Method: drawFeature
     */
    drawFeature: function(geometry) {		
		if (this.debug) {
			console.log("DrawEdge.js - drawFeature debug true" );
			//geometry = new OpenLayers.Geometry.LineString([new OpenLayers.Geometry.Point(0,0),new OpenLayers.Geometry.Point(20,20),]);
		}
		var attributes = {edgeType:this.edgeType};
		var options = {fid : this.layer.createUniqueFid()};
        var feature = new GeometricNet.Feature.Vector.Edge(geometry,attributes,options);
        //feature.attributes.edgeType = this.edgeType;
        if(this.debug){
	        console.log("drawEdge type: " + this.edgeType);
        }
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

    CLASS_NAME: "GeometricNet.Control.DrawFeature.DrawEdge"
});
