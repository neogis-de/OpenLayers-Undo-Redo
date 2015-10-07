import sys
geonet = open("../lib/GeometricNet.js")
compression = True
outfile = "GeometricNet.js"
licenseFile = "license.txt"

line = ''
append=False
contents = [];
while line.strip() !='//js-list-end':
    if line.strip() =='//js-list':
        append = True
        line =geonet.next()		
    if append == True:
		filepath =  line.strip().strip(',"')
		if filepath[0:2] != '//':
			print "JS files: " + filepath
			content = open(filepath).read()
			contents.append(content+"\n")
    line = geonet.next()
merged = "".join(contents)
#open("outfile.js", "w").write(merged)

have_compressor = None
try:
    import jsmin
    have_compressor = "jsmin"
except:
	pass
if compression & (have_compressor == "jsmin"):
	print("compressing files ...")
	merged = jsmin.jsmin(merged)
else:
	print("No compressor used")

license = open(licenseFile).read()

open(outfile, "w").write(license + "\n" + merged)
print("Out file: " + outfile)
print("Done.")
