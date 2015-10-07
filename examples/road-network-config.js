network = {
	name : "road_network",
	description : "road network",	
	nodeLayer : { 
		dataSource : {},		
		typeAttributeName : "nodeType",
		nodes : {
			"junction" : {
				name : "junction",
				startEdges : { "road" : {maxCount : 3} },
				endEdges : { "road" : {maxCount : 3} },
				controlOptions : {title:"Draw a junction ", displayClass : "olControlDrawFeaturePoint"}
			}
		}
	},
	edgeLayer : {
		dataSource : {},
		typeAttributeName : "edgeType",
		edges : {
			"road" : {
				name : "road",
				defaultStartNode : "junction",
				defaultEndNode : "junction",
				controlOptions : {title:"Draw a road", displayClass : "olControlDrawFeatureLine"}
			}
		}
	},
	projection : "EPSG:900913",
	isTopology : true,
	isEditable : true,
	tolerance : 1,
	isSplitWithEdge: false,
	isDirected : false,
	networkUrl : "php/network.php"
}
	 
				
				