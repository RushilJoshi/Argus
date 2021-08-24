var background = null;
var preview = null;
var ctx = null;

var dims = [1, 1, 1, 1];
var idcount = 0;
var sample_payload = {
    "blocks": [
        {
            "text": "GLP",
            "box": {
                "x0": 60,
                "y0": 68,
                "x1": 172,
                "y1": 122
            },
            "dotted": true, 
            "tableID": ""
        },
        {
            "text": "10-Feb-2021",
            "box": {
                "x0": 66,
                "y0": 138,
                "x1": 468,
                "y1": 188
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "11:37",
            "box": {
                "x0": 70,
                "y0": 202,
                "x1": 272,
                "y1": 250
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "10007230",
            "box": {
                "x0": 62,
                "y0": 262,
                "x1": 470,
                "y1": 318
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "6.474pH",
            "box": {
                "x0": 66,
                "y0": 326,
                "x1": 326,
                "y1": 378
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "38.4mV",
            "box": {
                "x0": 64,
                "y0": 382,
                "x1": 292,
                "y1": 438
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "22.2ºC ATC",
            "box": {
                "x0": 66,
                "y0": 456,
                "x1": 438,
                "y1": 504
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "Auto EP Standard",
            "box": {
                "x0": 72,
                "y0": 518,
                "x1": 654,
                "y1": 568
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "I20126",
            "box": {
                "x0": 68,
                "y0": 572,
                "x1": 306,
                "y1": 624
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "80238",
            "box": {
                "x0": 64,
                "y0": 638,
                "x1": 264,
                "y1": 688
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "Last cal.: 10-Feb-2021",
            "box": {
                "x0": 68,
                "y0": 688,
                "x1": 864,
                "y1": 754
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "11:29",
            "box": {
                "x0": 68,
                "y0": 754,
                "x1": 264,
                "y1": 804
            },
            "dotted": true,
            "tableID": "",
        },
        {
            "text": "S220",
            "box": {
                "x0": 64,
                "y0": 814,
                "x1": 224,
                "y1": 864
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "B952834615",
            "box": {
                "x0": 68,
                "y0": 874,
                "x1": 438,
                "y1": 926
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "10007230",
            "box": {
                "x0": 74,
                "y0": 942,
                "x1": 376,
                "y1": 988
            },
            "dotted": true,
            "tableID": ""
        },
        {
            "text": "Signature: ______(I&_______",
            "box": {
                "x0": 68,
                "y0": 990,
                "x1": 952,
                "y1": 1064
            },
            "dotted": true,
            "tableID": ""
        }
    ]
};

// INCOMPLETE
var patterns = {
    "dateMonths": ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
    "measureUnits": [],
    "labelKeywords": {
        "text": [],
        "digits": ["sn", "serial", "id", "number"],
        "misc": ["signature"],
        "measurement": ["osmolality", "osmole", "length", "width", "height"]
    }
};

function captureGroups(text) {


    // For dates(12/31/2021, 12-31-2021, [31-Dec-2021])
    var myRe = new RegExp('([0-9]{2})\-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\-([0-9]{4})');
    var ret = myRe.exec(text.toLowerCase());

    if (ret) {
        return ["date", ret[0], "x"];
    }


    // For times
    var myRe = new RegExp('([0-9]{1,2}):([0-9]{1,2})');
    var ret = myRe.exec(text);
    
    if (ret) {
        return ["time", text, "x"];
    }

    // For measurements (°C, °F, mV, pH, cm, mm, g, kg, Osm, mOsm, M / M)
    var myRe = new RegExp('([0-9]+\.?[0-9]*) ?(ºC|ºF|mV|pH|cm|mm|g|kg|Osm|mOsm)\/?(ºC|ºF|mV|pH|cm|mm|g|kg|Osm|mOsm)?(.*)');
    var ret = myRe.exec(text);
    
    if (ret) {
        var keyword = "measurement";
        for (var i = 0; i < patterns["labelKeywords"]["measurement"].length; i++) {
            var elem = patterns["labelKeywords"]["measurement"][i];

            if (text.toLowerCase().includes(elem)) {
                keyword = elem;
                break;
            }
        }
        
        return [keyword, ret[1], ret[2]];
    }

    // Strings
    var myRe = new RegExp('^([a-zA-Z]+)$');
    var ret = myRe.exec(text);

    if (ret) {
        var keyword = "text";
        for (var i = 0; i < patterns["labelKeywords"]["text"].length; i++) {
            var elem = patterns["labelKeywords"]["text"][i];

            if (text.toLowerCase().includes(elem)) {
                keyword = elem;
                break;
            }
        }
        
        return [keyword, ret[1], "x"];
    }

    // Digits
    var myRe = new RegExp('^([0-9]+)$');
    var ret = myRe.exec(text);

    if (ret) {
        var keyword = "number";
        for (var i = 0; i < patterns["labelKeywords"]["digits"].length; i++) {
            var elem = patterns["labelKeywords"]["digits"][i];

            if (text.includes(elem)) {
                keyword = elem;
                break;
            }
        }
        
        return [keyword, ret[1], "x"];
    }

    // Misc
    var myRe = new RegExp('^(.+)$');
    var ret = myRe.exec(text);

    if (ret) {
        var keyword = "misc";
        for (var i = 0; i < patterns["labelKeywords"]["misc"].length; i++) {
            var elem = patterns["labelKeywords"]["misc"][i];

            if (text.toLowerCase().includes(elem)) {
                keyword = elem;
                break;
            }
        }
        
        return [keyword, ret[1], "x"];
    }


    // Fallback case
    return ["", "text", "x"];
    
}

function drawBox(box, dims, dotted=false) {
    var x = box["box"]["x0"] * dims[2] / dims[0];
    var y = box["box"]["y0"] * dims[3] / dims[1];
    var width = (box["box"]["x1"] - box["box"]["x0"]) * dims[2] / dims[0];
    var height = (box["box"]["y1"] - box["box"]["y0"]) * dims[3] / dims[1];
    
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#FF0000";
    if (dotted)
        ctx.setLineDash([5, 10]);
    else
        ctx.setLineDash([])

    ctx.strokeRect(x, y, width, height);
}

function drawAll(payload, dims) {

    payload["blocks"].forEach( 
        function(box){
            drawBox(box, dims, box["dotted"]);
        }
    )
}

function handleDeletion(elem) {
    console.log(elem.id);
    var tableID = parseInt(elem.id.substring(0, elem.id.indexOf('d')));
    var i = parseInt(elem.id.substring(elem.id.indexOf('d')+1));

    sample_payload["blocks"][i]["dotted"] = !sample_payload["blocks"][i]["dotted"];

    let canvas = document.getElementById("preview");
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawAll(sample_payload, dims);

    removeTableData(i, tableID);
}

function addTableData(i, tableID) {
    if (tableID == "") {

        var table = document.getElementById("fieldTable");
        var row = table.insertRow();
        row.setAttribute("id", idcount+"")

        var groups = captureGroups(sample_payload["blocks"][i]["text"]);
        
        var tablestr = "";
        tablestr += "<td contenteditable='true'>" + groups[0] + "</td>";
        tablestr += "<td contenteditable='true'>" + groups[1] + "</td>";
        tablestr += "<td contenteditable='true'>" + groups[2] + "</td>";
        tablestr += "<td class=delete></td>";
        row.innerHTML += tablestr;
        row.childNodes[3].setAttribute("id", idcount+"d"+i);
        row.childNodes[3].setAttribute("onclick", "handleDeletion(this)");
        
        sample_payload["blocks"][i]["tableID"] = idcount;
        idcount += 1;

        var objDiv = document.getElementById("tableScroll");
        objDiv.scrollTop = objDiv.scrollHeight;

    }
}

function removeTableData(i, tableID) {
    var table = document.getElementById("fieldTable");
    var row = document.getElementById(sample_payload["blocks"][i]["tableID"]);
    row.parentNode.removeChild(row);
    sample_payload["blocks"][i]["tableID"] = "";

    var objDiv = document.getElementById("tableScroll");
    objDiv.scrollTop = objDiv.scrollHeight;
}

function getCursorPosition(canvas, event, payload, dims) {
    const rect = canvas.getBoundingClientRect();
    let x = (event.clientX - rect.left) * dims[0] / dims[2];
    let y = (event.clientY - rect.top) * dims[1] / dims[3];

    
    for (var i = 0; i < payload["blocks"].length; i++) {
        let box = payload["blocks"][i]["box"];


        if ((box["x0"] < x) && (x < box["x1"]) && (box["y0"] < y) && (y < box["y1"])) {
            console.log(i);
            payload["blocks"][i]["dotted"] = !payload["blocks"][i]["dotted"];

            let context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawAll(sample_payload, dims);

            if (payload["blocks"][i]["dotted"] == false) {
                addTableData(i, payload["blocks"][i]["tableID"]);
            }
            else {
                removeTableData(i, payload["blocks"][i]["tableID"]);
            }
        }
        
    }
        
    
}


function onSelectorReady(data) {
    background = document.getElementById("backgroundImage");
    preview = document.getElementById("preview");
    ctx = preview.getContext("2d");

    console.log("YEEET", data);
    sample_payload = data["data"];

    const canvas = document.getElementById("preview")
    canvas.addEventListener('mousedown', function(e) {
        getCursorPosition(canvas, e, sample_payload, dims);
    })

    


    background.src = data["url"];
    background.addEventListener("load", function() {

        
        var old_width = background.width;
        var old_height = background.height;

        alert(background.width + " " + background.height);
        

        var target = 480;
        var ratio = target / old_width;
        var new_height = old_height * ratio;

        background.setAttribute("width", target);
        background.setAttribute("height", new_height);
        preview.setAttribute("width", target);
        preview.setAttribute("height", new_height);

        ctx.canvas.width = target;
        ctx.canvas.height = new_height;
        // canvas.width = target;
        // canvas

        alert(target + " " + new_height);
        alert(preview.width + " " + preview.height);
        
        dims = [old_width, old_height, target, new_height];
        console.log(old_width, old_height);
        console.log(target, new_height);
        drawAll(sample_payload, dims);
    });
}

function submitToDataset() {
    alert("Yeet!");
    alert(sample_payload);
}