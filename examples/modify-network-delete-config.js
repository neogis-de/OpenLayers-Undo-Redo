network = {
	description : "this is my testing electrical network",
	name : "electric_network",
	nodeLayer : {	
		dataSource : {
			protocol : "HTTP",
			url : "php/network.php?request=getfeatures&network=electric_network&component=node",
			format : "GeoJSON",
			strategies : ["fixed"]			
		},		
		typeAttributeName : "nodeType",
		nodes : {
			"subStation" : {
				name : "sub station",
				endEdges : {},
				startEdges : {"highVoltage" : {maxCount:3} }, 
				contains : { },
				networkRelation : "in",
				onEdges : null,					
				controlOptions : {title:"Draw a sub station", displayClass : "olControlDrawFeaturePointSubStation"},
				symbols : {
					defaultStyle: { graphicName: "star", fillColor : "green",fillOpacity: 1,strokeColor:"green",pointRadius:10},
					select : {}
				}
			},
			"highMast" : {
				name : "high mast",
				endEdges : { "highVoltage":{ maxCount:1} }, 
				startEdges : { "highVoltage" : { maxCount:1} },						
				networkRelation : "in",
				controlOptions : {title:"Draw a high mast", displayClass : "olControlDrawFeaturePointHighMast"},
				symbols : {
					defaultStyle : {graphicName: "circle",  fillOpacity: 1,fillColor:"black",strokeColor:"black"},
					select : {}
				} 
			},			
			"transformer" : {
				name : "transformer",
				endEdges : { "highVoltage" :{maxCount:1} }, 
				startEdges: { "mainLine" : {maxCount:5} },
				networkRelation : "in",
				controlOptions : {title:"Draw a transformer", displayClass : "olControlDrawFeaturePointTransformer"},
				symbols : {
					defaultStyle :{graphicName: "triangle",fillOpacity: 1,fillColor:"blue",strokeColor:"blue"}
				}
			},
			"pole" : {
				name : "pole",
				endEdges : { "mainLine" : { maxCount:1} },
				startEdges : { "mainLine" : { maxCount:2}, 
							  "distributionLine" : {maxCount:4}
				}, 
				networkRelation : "in",
				controlOptions : {title:"Draw a pole", displayClass : "olControlDrawFeaturePointPole"},
				symbols : {
					defaultStyle : { graphicName: "circle", fillOpacity: 1,pointRadius:3,fillColor:"black",strokeColor:"black"}
				}
			},
			"connectionPoint" : {
				name : "connection point",
				endEdges : { "distributionLine" : {maxCount:1} },
				startEdges : {}, 
				networkRelation : "in",
				controlOptions : {title:"Draw a connection point", displayClass : "olControlDrawFeaturePointConnectionPoint"},
				symbols : {
					defaultStyle : { graphicName: "square", fillOpacity: 1 , fillColor : "red",strokeColor:"red",pointRadius:3}	
				}
			},
			"saperator" : {
				name : " saperator",
				isEditable : false,
				networkRelation : "on",
				onEdges : {"highVoltage" : {} , "mainLine" : {}},
				controlOptions : {title:"Draw a saperator", displayClass : "olControlDrawFeaturePointSaperator"},
				symbols : { 
					defaultStyle : { graphicName: "circle", fillOpacity: .3 , fillColor : "red",strokeColor:"red",pointRadius:3}	
				}
			}
		 }
	},
	edgeLayer : {
		dataSource : {
			protocol : "HTTP",
			url : "php/network.php?request=getfeatures&network=electric_network&component=edge",		
			format : "GeoJSON",
			strategies : ["fixed"]			
		},		
		typeAttributeName : "edgeType",
		edges : {
			"highVoltage" : {
				name:"high voltage",				
				defaultStartNode : "highMast",
				defaultEndNode : "highMast", 
				controlOptions : {title:"Draw a high voltage line", displayClass : "olControlDrawFeatureLineHighVoltage"},
				symbols : {
					defaultStyle : {strokeColor : "green",strokeWidth:3}
				}
			},
			"mainLine" : {
				name:"main line",				
				defaultStartNode : "pole",
				defaultEndNode : "pole",
				controlOptions : {title:"Draw a main line", displayClass : "olControlDrawFeatureLineMainLine"},
				symbols : { 
					defaultStyle : {strokeColor : "black"}
				}
			},
			"distributionLine" : {name:"distribution line",				
				defaultStartNode : "pole",
				defaultEndNode : "connectionPoint",
				controlOptions : {title:"Draw a distribution Line", displayClass : "olControlDrawFeatureLineDistributionLine"},
				symbols : {
					defaultStyle : {strokeColor : "yellow"}
				}
			}
		},
	},
	projection : "EPSG:900913",
	isTopology : true,
	tolerance : 1,
	isEditable : true,
	saveControlOptions : {title: "Save Network Features", displayClass : "olControlSaveFeatures" } ,
	isSplitWithEdge: false,
	isDirected : true,
	source	: { "subStation" : {maxCount:1} },
	sink : { "connectionPoint" : {maxCount:10000} },
	networkUrl : "php/network.php"
};
