GeometricNet.Util.debug = false;

/**
 * APIFunction: multiSort
 * 	for OLNetwork
 *  sort multi dimension array on the any index given
 * Parameters:
 *	array - {Array}
 *	i - {integer}  column index for which sorting to be done.
 * Returns:
 *	{Array}
 */
GeometricNet.Util.multiSort = function(array,index) {
	// TODO : it rerurns index column as first column, should retain the column index
	// Written By: WillyDuitt@hotmail.com | 03-10-2005 \\;
	for(var i=0; i<array.length; i++){
		var temp = array[i].splice(index,1);
		array[i].unshift(temp);
	} return array.sort();
};

/**
 * APIFunction: removeDuplicate
 * 	for OLNetwork
 *  reomve the duplicate from the array
 * Parameters:
 *	array - {Array}
 * Returns:
 *	{Array}
 */
GeometricNet.Util.removeDuplicate= function(oldArray) {
	var r = new Array();
	o:for(var i = 0, n = oldArray.length; i < n; i++)
	{
		for(var x = 0, y = r.length; x < y; x++)
		{
			if(r[x]==oldArray[i])
			{
				continue o;
			}
		}
		r[r.length] = oldArray[i];
	}
	return r;
};

/**
 * APIMethod: intersection
 *	for OLNetwork, TODO should be part of Geometry 
 * Returns the intersection of linestring geometry
 * Parameters:
 *	line - OpenLayers.Geometry.LineString 
 *	geom - OpenLayers.Geometry with which intersetion is calculated
 * Returns:
 *	Geometry
 */
GeometricNet.Util.intersection = function(line,geom) {
	var intersections=[];
	if (geom instanceof OpenLayers.Geometry.LineString) {
		if (line.intersects(geom)) {
			var targetParts,sourceParts;
			var seg1,seg2;
			var point;
			targetParts = line.getVertices();
			sourceParts = geom.getVertices();
			for (var i=0;i<targetParts.length-1;i++) {
				seg1= {x1:targetParts[i].x, y1:targetParts[i].y, x2:targetParts[i+1].x, y2:targetParts[i+1].y };
				for (var j=0;j < sourceParts.length-1;j++) {
					seg2= {x1:sourceParts[j].x, y1:sourceParts[j].y,x2:sourceParts[j+1].x, y2:sourceParts[j+1].y };
					point = OpenLayers.Geometry.segmentsIntersect(seg1,seg2,{point:true});
					if (point) {
						intersections.push(point);
					}
				}  
			}
		}
	}
	return intersections; 			
};

/**
 * APIMethod: LRSMeasure
 *	for OLNetwork
 *	to measure of point on linestring 
 * Parameters:
 *	line - <OpenLayers.Geometry.LineString>
 *	point - <OpenLayers.Geometry.Point>
 * Returns:
 *	{float}, between 0 and 1
 */
GeometricNet.Util.LRSMeasure = function(line,point,options) {
	var details = options && options.details;
	var tolerance = options && options.tolerance ? options.tolerance : 0.0;
	if (GeometricNet.Util.debug)	{
		console.log("LineString.js - tolerance: "+ tolerance);
		console.log("LineString.js - details: "+ details);
	}
	var seg = {};
	var length =0.0;
	var dist =0.0;
	var measureCalculated = false;
	var part1Points =[];
	var part2Points =[];
	var totalLength = line.getLength();
	var result ={};
	if(GeometricNet.Util.debug){console.log("no of segments: " +line.components.length-1)};
	for (var i=0;i<line.components.length-1;i++ ) {
		if(GeometricNet.Util.debug){console.log("components : " + i + " : " + line.components[i]);} 
		seg = {	x1: line.components[i].x,
				y1: line.components[i].y,
				x2: line.components[i+1].x,
				y2: line.components[i+1].y
			 };
		dist = OpenLayers.Geometry.distanceToSegment(point,seg).distance;
		if(GeometricNet.Util.debug){console.log("dist : " + dist);}
		if ( (dist < tolerance) && !measureCalculated  ) {
			if (GeometricNet.Util.debug){console.log("finished part 1 , starting part2");}
			length += line.components[i].distanceTo(point);
			measureCalculated = true;
			//return length/totalLength;				
			part1Points.push(line.components[i],point);
			part2Points.push(point,line.components[i+1]); 
		} else if (!measureCalculated) {
			if (GeometricNet.Util.debug){console.log("adding in part 1");}
			length += line.components[i].distanceTo(line.components[i+1]);
			part1Points.push(line.components[i]);
		} else {
			if (GeometricNet.Util.debug){console.log("adding in part 2");}
			part2Points.push(line.components[i+1]);				
		}
	}
	if (GeometricNet.Util.debug) {
		console.log("part2Points length :"+ part2Points.length);
		console.log("part2Points[0]:"+ part2Points[0].toString());
	}
	if (details){
		result = {
			measure : length/totalLength,
			subString1 : new OpenLayers.Geometry.LineString( part1Points ),
			subString2 : new OpenLayers.Geometry.LineString( part2Points )
		};
		if (GeometricNet.Util.debug)	{
			console.log("LineString - result.subString1:"+ result.subString1.toString());
			console.log("LineString - result.subString2:"+ result.subString2.toString());
		}

		return result;				
	} else {
		return length/totalLength;
	}
};

Array.prototype.isKey = function(){
  for(i in this){
    if(this[i] === arguments[0])
      return true;
  };
  return false;
}; 

/**
 * APIMethod: createFormat
 * create a format object given a format name
 * Parameters: 
 * format - {string}
 * Returns:
 * {OpenLayers.Format}
 */
GeometricNet.Util.createFormat = function(format){
	if (format.toLowerCase() == "geojson"){
		return new OpenLayers.Format.GeoJSON();
	} else if (format.toLowerCase == "gml"){
		return new OpenLayers.Format.GML();
	} else {
		return null;
	}
};

/** 
 * APIMethod: createProtocol
 * create a protocol object for a given protocol name
 * Parameters:
 * protocol - {string}
 * url - {string}
 * fromat - {OpenLayers.Format}
 * Retruns:
 * {OpenLayers.Protocol}
 */
GeometricNet.Util.createProtocol = function(protocol,url,format,params) {
	if (protocol.toLowerCase() == "http"){
		return new OpenLayers.Protocol.HTTP({ url : url,format : format, params : params});						
	}else {
		return null;
	}
};

/**
 * APIMethod: createStrategy
 * create a format object given a strategy name
 * Parameters: 
 * strategy - {string}
 * Returns:
 * {OpenLayers.Strategy}
 */
GeometricNet.Util.createStrategy = function(strategy){
	if (strategy.toLowerCase() == "fixed"){
		return new OpenLayers.Strategy.Fixed();
	} else if (strategy.toLowerCase == "bbox"){
		return new OpenLayers.Strategy.BBOX();
	} else {
		return null;
	}
};

/**
 * APIMethod: getStrategyByClassName
 * Paramaeters:
 * layer - OpenLayers.Layer.Vector
 * className - {string}
 * Returns:
 * {OpenLayers.Strategy}
 */
GeometricNet.Util.getStrategyByClassName = function(layer,className){
	if (layer.strategies && layer.strategies.length > 0){
		for (var i=0;i<layer.strategies.length;i++) {
			if (layer.strategies[i].CLASS_NAME == className){
				return layer.strategies[i];
			}			
		}
	}
	return null;
};