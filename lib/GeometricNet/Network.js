/**
 * Class: GeometricNet.Network
 * Instance of GeometricNet.Network are used to create network object,
 * netwrok object manages all nework properties like edge,nodes,rules, graph etc
 */
GeometricNet.Network = OpenLayers.Class({
	/**
	 * APIProperty: name
	 * {string} name of the network
	 */
	name: null,
	/**
	 * APIProperty: map
	 * {<OpenLayers.Map>} map oject with which this network is associated
	 */
	map: null, 
	/**
	 * APIProperty: config
	 * {object}
	 * Network configuration
	 */  
	config: {},	

	/** 
	 * APIProperty: edge
	 * {GeometricNet.Layer.Vector.Edge}
	 * Edge layer of this network
	 */
	edge: null,
	
	/** 
	 * APIProperty: node
	 * {GeometricNet.Layer.Vector.Node}
	 * Node layer of this network
	 */
	node: null,

	/**
	 * Property: uidPrefix
	 * {string}
	 * a unique prefix for this session 
	 */
	uidPrefix: "",
	
	/**
	 * Constructor: GeometricNet.Network
	 *
	 * Parameters:
	 * name - {string} name of the network
	 * map - 
	 * optrions - {oject} hashtable of extra options of network
	 */
	initialize: function(name,map,config){		
		//TODO remove name as parameter
		if (name == undefined && map == undefined && config == undefined) {
			return null;
		}		
		this.name=config.name;
		if (map instanceof OpenLayers.Map) {
			this.map =map;
		} else {
			return null;
		}
		this.config = config;
		// create node layer		
		this.node = this.createNodeLayer(this.config);
		this.node.network = this;
		map.addLayer(this.node);
		//create edge layer
		this.edge = this.createEdgeLayer(this.node,this.config);
		this.edge.network = this;
		map.addLayer(this.edge);
		
		// get uid prefix
		this.getUidPrefix();
	},

	/**
	 * Method: createNodeLayer
	 * function to create network node layer
	 * Parameters:
	 * Returns:
	 * {<GeometricNet.Layer.Vector.Node>}
	 */
	createNodeLayer: function(networkConfig) {			
		var options={};		
		var defaultLookup = {};
		var symbolCount = 0;
		for (node in networkConfig.nodeLayer.nodes){
			if (networkConfig.nodeLayer.nodes[node].symbols) {
				defaultLookup[node] = networkConfig.nodeLayer.nodes[node].symbols.defaultStyle;
				symbolCount++;
			}
		}
		if (symbolCount > 0){
			var styleMap = new OpenLayers.StyleMap();
			styleMap.addUniqueValueRules("default", networkConfig.nodeLayer.typeAttributeName,defaultLookup);
			options.styleMap = styleMap;		
		}
		options.projection = networkConfig.projection;
		if(networkConfig.nodeLayer.dataSource.strategies) {
			var strategies = [];
			for (var i=0;i<networkConfig.nodeLayer.dataSource.strategies.length;i++){			
				strategies.push(GeometricNet.Util.createStrategy(
					networkConfig.nodeLayer.dataSource.strategies[i]));
			}
	 		options.strategies =strategies;
	 		if (networkConfig.isEditable == true) {
				options.strategies.push( new OpenLayers.Strategy.Save()); 
 			}
 		}
 		if(networkConfig.nodeLayer.dataSource.protocol) {
	 		var format = GeometricNet.Util.createFormat(
	 						networkConfig.nodeLayer.dataSource.format);
	 		//var params = {component : "node",network=this.name};
	 		var params = {};
	 		var protocol = GeometricNet.Util.createProtocol(
	 						networkConfig.nodeLayer.dataSource.protocol,
	 						networkConfig.nodeLayer.dataSource.url,format,params);
	 		options.protocol = protocol;
 		} 		
		options.network = this; 
		var nodeLayer = new GeometricNet.Layer.Vector.Node(this.name+"_node",options);		
		return nodeLayer;		
	},

	/**
	 * Method: createEdgeLayer
	 * function to create network edge layer
	 * Parameters:
	 * Returns:
	 * {<GeometricNet.Layer.Vector.Edge>}
	 */
	createEdgeLayer: function(node,networkConfig) {		
		var options={};
		var defaultLookup = {};
		var symbolCount = 0;
		for (edge in networkConfig.edgeLayer.edges){
			if(networkConfig.edgeLayer.edges[edge].symbols) {
				defaultLookup[edge] = networkConfig.edgeLayer.edges[edge].symbols.defaultStyle;
				symbolCount++;
			}
		}
		if (symbolCount> 0) {
			var styleMap = new OpenLayers.StyleMap();
			styleMap.addUniqueValueRules("default", networkConfig.edgeLayer.typeAttributeName,defaultLookup);
			options.styleMap = styleMap;		
		}
		options.projection = networkConfig.projection;
		if (networkConfig.edgeLayer.dataSource.strategies) {
			var strategies = [];
			for (var i=0; i<networkConfig.edgeLayer.dataSource.strategies.length;i++){
				strategies.push(GeometricNet.Util.createStrategy(
					networkConfig.edgeLayer.dataSource.strategies[i]));
			}
	 		options.strategies =strategies;
	 		if (networkConfig.isEditable == true) {
		 		options.strategies.push( new OpenLayers.Strategy.Save()); 
	 		}

 		}
 		if (networkConfig.edgeLayer.dataSource.protocol) {
	 		var format = GeometricNet.Util.createFormat(
	 						networkConfig.edgeLayer.dataSource.format);
	 		//var params = {component : "edge",network : this.name};
	 		var params = {};
	 		var protocol = GeometricNet.Util.createProtocol(
	 						networkConfig.edgeLayer.dataSource.protocol,
	 						networkConfig.edgeLayer.dataSource.url,format,params);
	 		options.protocol = protocol; 		
 		}
		options.network = this; 
		var edgeLayer = new GeometricNet.Layer.Vector.Edge(this.name+"_edge",node,options);		
		return edgeLayer;	
	},
	
	/**
	 * APIMethod: createNodeControls
	 * create network features edge,node layers and control   
	 * Parameters:	 
	 */
	createNodeControls: function(){
		var controls=[];
		for (node in this.config.nodeLayer.nodes){
			var isEditable = true;
			if (this.config.nodeLayer.nodes[node].isEditable != undefined){
				isEditable = this.config.nodeLayer.nodes[node].isEditable;
			}						
			if(isEditable && this.config.nodeLayer.nodes[node].controlOptions) {
				this.config.nodeLayer.nodes[node].controlOptions.nodeType = node; 
				controls.push(new GeometricNet.Control.DrawFeature.DrawNode(
					this.node,OpenLayers.Handler.Point,this.config.nodeLayer.nodes[node].controlOptions));
			}
		}
		return controls;
	},
		
	/**
	 * APIMethod: createEdgeControls
	 * create network features edge,node layers and control   
	 * Parameters:	 
	 */
	createEdgeControls: function(){
		var controls=[];
		for (edge in this.config.edgeLayer.edges){
			var isEditable = this.config.edgeLayer.edges[edge].isEditable ? 
				this.config.edgeLayer.edges[edge].isEditable : true;			
			if(isEditable && this.config.edgeLayer.edges[edge].controlOptions) {
				this.config.edgeLayer.edges[edge].controlOptions.edgeType = edge; 
				controls.push(new GeometricNet.Control.DrawFeature.DrawEdge(
					this.edge,OpenLayers.Handler.Path,this.config.edgeLayer.edges[edge].controlOptions));
			}
		}
		return controls;
	},

	/**
	 * APIMethod: createEditPanel
	 * Create control panel with editable feature control
	 * Parameters:
	 * isSnapping - {boolean}
	 * Returns: 
	 * {OpenLayers.Control.Panel}
	 */
	createEditPanel: function(isSnapping){
		var panel = new OpenLayers.Control.Panel();
		panel.name = this.name+"_editPanel";
		var controls =[];
 		controls= controls.concat(this.createEdgeControls());
 		controls= controls.concat(this.createNodeControls());
 		
		if (this.config.saveControlOptions){
			var saveControlOptions = this.config.saveControlOptions;
			saveControlOptions.trigger = this.save;
 			var saveControl = new OpenLayers.Control.Button(saveControlOptions);
 			saveControl.network = this;
 			controls.push(saveControl);
		}
		// add modify control 		
		controls.push(this.createModifyControl());
		//add delete controls
		controls.push(this.createDeleteNodeControl());
		controls.push(this.createDeleteEdgeControl());
 		panel.addControls(controls);		
	  	//this.map.addControl(panel);
		if (isSnapping){
	 		var edgeToNodeSnap = new OpenLayers.Control.Snapping({ layer:this.edge ,targets:[{layer:this.node}] }); 
	 		this.map.addControl(edgeToNodeSnap);
	 		edgeToNodeSnap.activate();
	 		var nodeToEdgeSnap = new OpenLayers.Control.Snapping({ layer:this.node ,targets:[{layer:this.edge}] }); 
	 		this.map.addControl(nodeToEdgeSnap);
	 		nodeToEdgeSnap.activate();            
	 		var edgeToEdgeSnap = new OpenLayers.Control.Snapping({layer:this.edge});
	 		this.map.addControl(edgeToEdgeSnap);
	 		edgeToEdgeSnap.activate();
	 		var nodeToNodeSnap = new OpenLayers.Control.Snapping({layer:this.node});
	 		this.map.addControl(nodeToNodeSnap);
	 		nodeToNodeSnap.activate();	
 		}
 		return panel;	
	},
	
	/**
	 * APIProperty: createModifyControl
	 * Create control to modify network while retaining the network topology
	 */
	createModifyControl: function() {
		var control = new OpenLayers.Control.ModifyFeature(this.node,
					{title:"Move Node",
					 displayClass : "olControlModifyFeature",
					 mode : OpenLayers.Control.ModifyFeature.DRAG });
		return control;
	},
	
	/**
	 * APIProperty: createDeleteNodeControl
	 * Create control to delete network feature while retaining the network topology
	 */
	createDeleteNodeControl: function() {
		var control = new GeometricNet.Control.DeleteNode(this.node,
					{title:"Delete Node",
					 displayClass : "olControlDeleteNode"});
		/*r deleteEdge = new GeometricNet.Control.DeleteEdge(this.edge,
					{title:"Delete Edge",
					 displayClass : "olControlDeleteEdge"});*/
		return control;
	},
	
	/**
	 * APIProperty: createDeleteEdgeControl
	 * Create control to delete network edge feature while retaining the network topology
	 */
	createDeleteEdgeControl: function() {
		var control = new GeometricNet.Control.DeleteEdge(this.edge,
					{title:"Delete Edge",
					 displayClass : "olControlDeleteEdge"});
		return control;
	},
	/**
	 * APIProperty: getUidPrefix
	 * get the prefix to generate Uid for componets for this session 
	 * and set at respective layer
	 * Parameters:
	 * component - {string}
	 * network componenct name "node" , "edge"
	 */
	getUidPrefix: function(options) {
		params = { "request" : "getuidprefix",
				"network" : this.name };		
		if(this.config.networkUrl){
	        resp = OpenLayers.Request.GET({
	            url: this.config.networkUrl,
	            callback: this.parseUidPrefix.bind(this),
	            params: params,
	        });
    	}
    	return null;
	},

	/**
	 * Method: parseUidPrefix
	 * parse the response of the parseUidPrefix
	 */
	parseUidPrefix: function(){
		if (resp.status >= 200 || resp.status <= 300 )	{		
			this.uidPrefix = resp.responseText;
		}
	},
//  	var save = new OpenLayers.Control.Button({
//         title: "Save Changes",
//         trigger: function() {
//             if(edit.feature) {
//                 edit.selectControl.unselectAll();
//             }
//             saveStrategy.save();
//         },
//         displayClass: "olControlSaveFeatures"
//     });

	/**
	 * Method: save
	 * Save network features to server, basicaly calls save strategy-save function
	 * for each layer in network
	 */
	save: function(){		
		//TODO "this" is not clear 
		//alert("Saving modified or new network features to server.");	
		var saveNode = GeometricNet.Util.getStrategyByClassName(this.network.node,
							"OpenLayers.Strategy.Save");
		saveNode.save();
		saveNode.save(this.network.node.removedFeatures);
		this.network.node.removedFeatures.length=0;
		
		var saveEdge = GeometricNet.Util.getStrategyByClassName(this.network.edge,
							"OpenLayers.Strategy.Save");
		saveEdge.save();
		saveEdge.save(this.network.edge.removedFeatures);
		this.network.edge.removedFeatures.length=0;
		alert("Saved modified or new network features to server.");	
	}, 	
	
	CLASS_NAME: "GeometricNet.Network"
});
