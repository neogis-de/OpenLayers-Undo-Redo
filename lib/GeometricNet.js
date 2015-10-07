// this approach is taken from OpenLayers library 
(function() {

	var jsfiles=new Array(
			//js-list 
			"../lib/OpenLayers/OpenLayers.js",					
			"../lib/GeometricNet/NameSpace.js",
			"../lib/GeometricNet/Control/DeleteEdge.js",
			"../lib/GeometricNet/Control/DeleteNode.js",
			"../lib/GeometricNet/Control/DrawFeature/DrawEdge.js",
			"../lib/GeometricNet/Control/DrawFeature/DrawNode.js",			
			"../lib/GeometricNet/Feature/Vector/Node.js",
			"../lib/GeometricNet/Feature/Vector/Edge.js",
			"../lib/GeometricNet/Layer/Vector/Node.js",
			"../lib/GeometricNet/Layer/Vector/Edge.js",			
			"../lib/GeometricNet/Util.js",
			"../lib/GeometricNet/Graph.js",
			"../lib/GeometricNet/Layer/Vector/Flag.js",			
			"../lib/GeometricNet/Network.js"			
			//js-list-end
		);

	var agent = navigator.userAgent;
    var docWrite = (agent.match("MSIE") || agent.match("Safari"));
    if(docWrite) {
        var allScriptTags = new Array(jsfiles.length);
    }
    //var host = OpenLayers._getScriptLocation() + "lib/";    
    
    //create namespace
    //document.write("<script src='Prototype/prototype.js'> </script>" +
	//				"<script src='package1.0.0/Package.js'> </script> "
	//			  );

   	//var pkg = new Package("GeometricNet.Speak");
	//pkg.require("GeometricNet.Speak");
		
	//Package.include(["GeometricNet/Hello.js"]);
	//window.OpenLayers = {};
	//window.GeometricNet = {};
    for (var i=0, len=jsfiles.length; i<len; i++) {
        if (docWrite) {
            allScriptTags[i] = "<script src='" + jsfiles[i] +
                               "'></script>"; 
        } else {
            var s = document.createElement("script");
            s.src = jsfiles[i];
            var h = document.getElementsByTagName("head").length ? 
                       document.getElementsByTagName("head")[0] : 
                       document.body;
            h.appendChild(s);
        }
    }
    if (docWrite) {
        document.write(allScriptTags.join(""));
    }

})();
