/**
 * @requires OpenLayers/Control.s
*/

/**
 * Class: GeometricNet.Control.DeleteNode
 * This DeleteNode control delete the node feature on click
 * 
 * Inherits from:
 * {<OpenLayers.Control>}
 */

GeometricNet.Control.DeleteNode = OpenLayers.Class(OpenLayers.Control, {
	/**
	 * Constructor: GeometricNet.Control.DeleteNode
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
		this.layer.removeNode(feature);
	},
	
	CLASS_NAME: "GeometricNet.Control.DeleteNode"
});	
