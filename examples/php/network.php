<?php

switch($_SERVER['REQUEST_METHOD']) {
	case 'GET': $requestType = "GET"; break;
	case 'POST': $requestType = "POST"; break;
	case 'PUT': $requestType = "PUT"; break;
	case 'DELETE': $requestType = "DELETE"; break;
}
//check request type
if ($requestType == 'GET') {
	$params = $_REQUEST;
	$request = $params["request"];
	$network = $params["network"];	
	switch($request) {
		case "getuidprefix" :			
			processGetUidPrefix();
			break;
		case "getfeatures" :
			$component = $params["component"];
			processGetFeatures($network,$component);
			break;
			//read the data
			/*$filePath = "../data/".$network."/".$component.".json";
			$file = fopen($filePath, 'r');
			$data = fread($file,filesize($filePath));
			fclose($file);
			echo $data;	*/
		case "getlock" :			
			processGetLock($network);
			break;
		case "releaselock":
			$key = $params["key"];
			processReleaseLock($network,$key);
			break;		
	}
} else if ($requestType == 'POST') {
	$network = $_GET["network"];
	$component = $_GET["component"];
	$featureCollection = $HTTP_RAW_POST_DATA;
	$features = deserializeFeatures($featureCollection);
	$dbHandle = connectDB($network);
	$ids = insertFeatures($component,$features);		
	mysql_close($dbHandle);
	$insertedFeatures = getProcessedFeatures($features,$ids);
	echo serializeFeatures($insertedFeatures);
} else if ($requestType == 'PUT') {
	$network = $_GET["network"];
	//in openlayers in put method feature id is attached with url with "/" may be to make restfull 
	$componentWithId = explode("/",$_GET["component"]);
	$component = $componentWithId[0];	
	$featureCollection = file_get_contents("php://input");
	$features = deserializeFeatures($featureCollection);
	$dbHandle = connectDB($network);
	$ids = updateFeatures($component,$features);
	mysql_close($dbHandle);
	$updatedFeatures = getProcessedFeatures($features,$ids);	
	//echo serializeFeatures($updatedFeatures);
	echo json_encode($updatedFeatures[0]);
} else if ($requestType == 'DELETE') {
	$network = $_GET["network"];
	//in openlayers in delete method feature id is attached with url with "/" may be to make restfull 
	$componentWithId = explode("/",$_GET["component"]);
	$component = $componentWithId[0];	
	$id=$componentWithId[1];
	//$featureCollection = file_get_contents("php://input");
	//$features = deserializeFeatures($featureCollection);
	$dbHandle = connectDB($network);
	$deletedFeatures = deleteFeatures($component,array($id));
	mysql_close($dbHandle);
	//$updatedFeatures = getProcessedFeatures($features,$ids);	
	//echo serializeFeatures($updatedFeatures);
	echo json_encode($deletedFeatures[0]);
}

function processGetLock($network){
	$filePath ="../data/".$network.".lck";
	//$lockFile = fopen($filePath,"r");
	if(file_exists($filePath)){
		$lockFile = fopen($filePath,"r");
		$fileSize = filesize($filePath);
		if($fileSize > 0){
			$networkKey = fread($lockFile,$fileSize);
		} else {
			$networkKey = "";
		}
		fclose($lockFile);	
	} else {						
		$networkKey = "";
	}
	//echo "fileSize: ".$fileSize." <br>" ;
	if ($networkKey == ""){
		$lockFile = fopen($filePath,"w+");
		$networkKey = uniqid($network);
		fwrite($lockFile,$networkKey);
		fclose($lockFile);
		echo $networkKey;
	} else {
		echo "false";
	}
}

function processReleaseLock($network,$key){
	$filePath ="../data/".$network.".lck";
	$lockOpened="false";
	if(file_exists($filePath)){		
		$fileSize = filesize($filePath);
		if ($fileSize > 0 ) {
			$lockFile = fopen($filePath,"r");
			$networkKey = fread($lockFile,$fileSize);
			fclose($lockFile);
			if ($key == $networkKey){
				$lockOpened = "true";
				$lockFile = fopen($filePath,"w+");
				fclose($lockFile);
			} 
		} 
	} 
	echo $lockOpened;	
}

function processGetUidPrefix(){
	echo uniqid();	
}

function processGetFeatures($network,$component) {
	$dbHandle = connectDB($network);
	$sql =  "select feature from ".$component;
	$result = mysql_query($sql);
	$features = array();
	if($result) {
		while($row = mysql_fetch_row($result) ){
			array_push($features,json_decode($row[0])); 
		}
	}
	echo serializeFeatures($features);	
}
function deserializeFeatures($jsonString) {
	$features = array();
	$inputJson = json_decode($jsonString);
	if ($inputJson->type == "FeatureCollection"){
		$features = json_decode($jsonString)->features;
	} else if ( $inputJson->type == "Feature"){
		$features[0] = $inputJson;
	}
	return $features;
}

function serializeFeatures($features){
	$obj = array("type" => "FeatureCollection");
	$obj["features"] = array();
	foreach($features as $feature) {
		array_push($obj["features"],$feature);
	}
	return json_encode($obj);
}

function appendFeaturesToFile($file,$features){
	$str ="";
	foreach ($features as $feature){
		$featJson = json_encode($feature);
		$str = $featJson."\n";
	}
	fwrite($file,$str);
}

function connectDB($db){
	//echo "connecting to DB \n";
	$server = "localhost";
	$user = "network";
	$pass = "geonet";
	$dbHandle = mysql_connect($server,$user,$pass);
	$selected = mysql_select_db($db);
	if ($selected){
		//echo "connected to DB";
		return $dbHandle;
	} else {
		//echo "not connected to DB";
		return false;
	}
};

function insertFeatures($component,$features){
	$ids = array();
	foreach($features as $feature) {
		$id = $feature->id;
		$featureJson = json_encode($feature);
		$sql = "insert into ".$component." values('".$id."', '".$featureJson."')";		
		//echo "\n ssql query: ".$sql;
		if(mysql_query($sql) ) {
			//echo "inserted feature id: ".$id;
			array_push($ids,$id);
		}
	}
	//echo "\n id: ".$ids[0];
	return $ids;
};

function updateFeatures($component,$features){
	$ids = array();
	foreach($features as $feature) {
		$id = $feature->id;
		$featureJson = json_encode($feature);
		// update edge set feature=$featureJson where id = $id;
		$sql = "update ".$component." set feature='".$featureJson."' where fid ='".$id."'";
		//echo "\n update sql: ".$sql;		
		if(mysql_query($sql) ) {			
			array_push($ids,$id);
		}
	}
	return $ids;
};

function deleteFeatures($component,$ids){
	$sql="select feature from ".$component." where fid in ('".implode(',',$ids)."')";	
	$result = mysql_query($sql);
	$features = array();
	if($result) {
		while($row = mysql_fetch_row($result) ){
			array_push($features,json_decode($row[0])); 
		}
	}
	//delete features from table
	$sql_del="delete from ".$component." where fid in ('".implode(',',$ids)."')";
	//echo "sql_del: ".$sql_del;
	if(mysql_query($sql_del)){
		return $features;
	} else {
		return array();
	}	
};

function toJson($ids){
	$obj = array();
	$obj["features"] =  array();
	foreach($ids as $id) {
		array_push($obj["features"],array("id"=>$id)); 
	}
	return json_encode($obj);
};

function getProcessedFeatures($features,$processedIds){
	$processedFeatures =array();
	foreach($features as $feature){
		if (in_array($feature->id,$processedIds)) {	
			array_push($processedFeatures,$feature);
		}
	}	
	return $processedFeatures;
};

function createUniqFid($network,$component){
	$uidPrefix = uniqid();	
	$dbHandle = connectDB($network);
	$sql =  "select feature from ".$component;
	$result = mysql_query($sql);
	$features = array();
	if($result) {
		while($row = mysql_fetch_row($result) ){
			array_push($features,json_decode($row[0])); 
		}
	}
	$delSql = "delete from ".$component;
	$delRes = mysql_query($delSql);
	$newFeatures = array(sizeof($features));
	if ($component == "edge"){
		$feature->id = "edge_".$uidPrefix."_".$feature->id;
		$feature->properties->startNode = "node_".$uidPrefix."_".$feature->properties->startNode;
		$feature->properties->endNode = "node_".$uidPrefix."_".$feature->properties->endNode;
	}	
};
?>
