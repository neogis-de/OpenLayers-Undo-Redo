/**
 * @requires OpenLayers/Control.s
*/

/**
 * Class: GeometricNet.Control.DeleteEdge
 * This DeleteEdge control delete the edge feature on click
 * 
 * Inherits from:
 * {<OpenLayers.Control>}
 */

GeometricNet.Control.DeleteEdge = OpenLayers.Class(OpenLayers.Control, {
	/**
	 * Constructor: GeometricNet.Control.DeleteEdge
	 */
	initialize: function(layer,options) {
		OpenLayers.Control.prototype.initialize.apply(this, [options]);
		this.layer = layer;
		this.handler = new OpenLayers.Handler.Feature(
			this, layer, {click: this.onClickFeature}
		);
	},

	/**
	 * Method: onClickFeature
	 */
	onClickFeature: function(feature) {
		this.layer.removeEdge(feature);
	},
	
	CLASS_NAME: "GeometricNet.Control.DeleteEdge"
});	
