

const accountName = "eisocrstorage";
const sasString = "sp=racwdl&st=2021-08-04T04:27:14Z&se=2022-08-04T12:27:14Z&sv=2020-08-04&sr=c&sig=GtTj923flBWW%2F5toBhMcJPKR2SqD5u%2Fx8SuOxfmw4ak%3D";
const containerName = "images";
const containerURL = new azblob.ContainerURL(
    `https://${accountName}.blob.core.windows.net/${containerName}?${sasString}`,
    azblob.StorageURL.newPipeline(new azblob.AnonymousCredential));



var displaymode = 0;
var count = 0;
var contourFound = false;
var lockImage = false;
var scanRunning = true;
var sized = false;

var payload_global;
var url_global;

let FRAME_REQUIREMENT = 5;
let verbose = false;
const { createWorker, createScheduler } = Tesseract;
const scheduler = createScheduler();

function discardProjection() {
    console.log("Clearing frame");
    let buttons = document.getElementById("projectionButtons");
    let canvasFrame = document.getElementById("canvasOutputProjected"); // canvasFrame is the id of <canvas>
    let ctx = canvasFrame.getContext("2d");
    ctx.clearRect(0, 0, canvasFrame.width,  canvasFrame.height);
    buttons.style.display = "none";
    lockImage = false;
}

function captureDocument() {

    if (contourFound) {
        console.log("Frame found!");
    }
    else {
        alert("Frame not found, doing screen-wide OCR");
    }
    lockImage = true;

    uploadFiles();
    // doOCR();
}

function toggleDisplayMode() {
    let modebutton = document.getElementById("modebutton");
    if (displaymode == 0) {
        modebutton.style.opacity = "1";
        
        displaymode = 1;
    }
    else if (displaymode == 1) {
        modebutton.style.opacity = "0.3";
        displaymode = 0;
    }
}

function drawBoxPreview(box, dims, dotted=false) {
    let canvasFrame = document.getElementById("canvasOutputProjected"); // canvasFrame is the id of <canvas>
    let ctx = canvasFrame.getContext("2d");
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
    console.log("box drawn!!");
}

const uploadFiles = async () => {
    // try {
        console.log("uploading file...");
        var oproj = document.getElementById("canvasOutputProjected");
        oproj.toBlob(
            function(blob) {
                var url = URL.createObjectURL(blob);
                const promises = [];
                const blockBlobURL = azblob.BlockBlobURL.fromContainerURL(containerURL, "im.png");
                
                
                azblob.uploadBrowserDataToBlockBlob(azblob.Aborter.none, blob, blockBlobURL).then(
                    function() {
                        console.log("DONE!!! :)))");

                        var uploadURL = blockBlobURL["url"];
                        var uriBase = "https://eis-ocr.cognitiveservices.azure.com/" + "vision/v3.1/ocr";
                        var subscriptionKey = "edf5c9795abe48a39708216eaa1a5c3d";
                        // Request parameters.
                        var params = {
                            "language": "unk",
                            "detectOrientation": "true",
                        };

                        $.ajax({
                            url: uriBase + "?" + $.param(params),
                
                            // Request headers.
                            beforeSend: function(jqXHR){
                                jqXHR.setRequestHeader("Content-Type","application/json");
                                jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
                            },
                
                            type: "POST",
                
                            // Request body.
                            data: '{"url": ' + '"' + uploadURL + '"}',
                        })
                        .done(function(data) {
                            // Show formatted JSON on webpage.
                            let buttons = document.getElementById("projectionButtons");
                            buttons.style.display = "flex";
                            var payload = {"blocks":[]};
                            for (var i = 0; i < data["regions"].length; i++) {
                                for(var j = 0; j < data["regions"][i]["lines"].length; j++) {
                                    
                                    var linebox = data["regions"][i]["lines"][j]["boundingBox"].split(",").map(n=>+n);
                                    var newData =  {
                                        "text":"",
                                        "box":{
                                            "x0":linebox[0], 
                                            "y0":linebox[1], 
                                            "x1":linebox[0]+linebox[2], 
                                            "y1":linebox[1]+linebox[3]
                                        },
                                        "dotted":true,
                                        "tableID":""
                                    };
                                    

                                    for(var k = 0; k < data["regions"][i]["lines"][j]["words"].length; k++) {
                                        newData["text"] += data["regions"][i]["lines"][j]["words"][k].text;
                                    }
                                    payload["blocks"].push(newData);
                                }
                            }

                            console.log("Payload constructed: ", payload);
                            payload["blocks"].forEach( 
                                function(box){
                                    drawBoxPreview(box, [1, 1, 1, 1], false);
                                }
                            );
                            payload_global = payload;
                            url_global = uploadURL;
                            
                        })

                    }
                );

            }
        );
        

        

    // } catch (error) {
    //     alert(error.body.message);
    // }
}

function stopVideo() {
    let video = document.getElementById("videoInput");
    let stream = video.srcObject;
    if (stream) {
        let tracks = stream.getTracks();
        
        tracks.forEach(function(track) {
            track.stop();
        });
        
        video.srcObject = null;
    }
}





function cvcode(isIOS) {

    // Get video from media
    let video = document.getElementById("videoInput"); // video is the id of video tag

    let iosOptions = {
        facingMode: { exact: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 } 
    };
    let otherOptions = { 
        width: { ideal: 1280 },
        height: { ideal: 720 } 
    };
    let vidOptions = isIOS ? iosOptions: otherOptions;

    
    console.log("LOGGING MEDIA DEVICES:");
    console.log(navigator.mediaDevices.enumerateDevices());

    
    
    // Get HTML elements, set constants

    let canvasFrame = document.getElementById("canvasOutput"); // canvasFrame is the id of <canvas>
    let context = canvasFrame.getContext("2d");
    const FPS = 15;

    // Process video

    function processVideo() {


        // Start time for framerate delay
        let begin = Date.now();

        // Check if video has loaded
        if (video.videoHeight != 0) {


            // Get video dimensions, set initial canvas to same height [IMPORTANT]
            let height = video.videoHeight;
            let width = video.videoWidth;
            let new_width = height / 9 * 16;

            contourFound = false;

            if (isIOS) {
                if (!sized) {
                    video.height = video.videoHeight;
                    video.width = video.videoWidth;
                    canvasFrame.height = height;
                    canvasFrame.width = width;
                    sized = true;
                }
            }
            else {
                video.height = video.videoHeight;
                video.width = video.videoWidth;
                canvasFrame.height = height;
                canvasFrame.width = width;
            }

            // Draw image from video to initial canvas, get data into orig matrix
            context.drawImage(video, 0, 0);

            let orig = new cv.Mat(height, width, cv.CV_8UC4);
            orig.data.set(context.getImageData(0, 0, width, height).data);
            
            // Create a padded version of the original, get rid of original
            let orig_padded = new cv.Mat();
            let diff = new_width - width;
            cv.copyMakeBorder(orig, orig_padded, 0, 0, diff/2, diff/2, cv.BORDER_CONSTANT, new cv.Scalar(50, 50, 50, 255));
            orig.delete();


            // Create a scaled down version of the padded original (to 240p 16:9)
            let prev_rows = orig_padded.rows;
            let scale = prev_rows / 240;
            let src = new cv.Mat();
            cv.resize(orig_padded, src, new cv.Size(240, 240/9*16), 0, 0, cv.INTER_AREA);

            // Convert src to grayscale
            cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

            
            // Apply thresholding to src
            let gray_mean = cv.mean(src)[0];
            cv.GaussianBlur(src, src, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
            cv.threshold(src, src, gray_mean + (255-gray_mean)*0.20, 255, cv.THRESH_BINARY);
            cv.GaussianBlur(src, src, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

            // Run canny edge detection
            cv.Canny(src, src, 30, 50, 3, false);

            // Find contours
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            // Get area for all contours so we can find the biggest
            let sortableContours = [];
            for (let i = 0; i < contours.size(); i++) 
            {
                let cnt = contours.get(i);
                let area = cv.contourArea(cnt, false);
                let perim = cv.arcLength(cnt, false);

                sortableContours.push({ areaSize: area, perimiterSize: perim, contour: cnt });
            }
            sortableContours = sortableContours.sort((item1, item2) => { return (item1.areaSize > item2.areaSize) ? -1 : (item1.areaSize < item2.areaSize) ? 1 : 0; }).slice(0, 5);


            // Get bounding box of largest contour, draw bounding box
            if (sortableContours.length > 0) {

                // Get largest contour
                let cnt = sortableContours[0].contour;
                
                // Approximate polynomial bounding box of largest
                let approx = new cv.Mat();
                cv.approxPolyDP(sortableContours[0].contour, approx, .05 * sortableContours[0].perimiterSize, true);
                
                if (verbose)
                    console.log(cv.contourArea(cnt));

                // Check if contour area is sufficiently large [UPDATE THIS]
                if (cv.contourArea(cnt) > 3000) {
                    
                    // Check if the polynomial is a quadrilatreral
                    if (approx.rows == 4) {
                        
                        // Draw coordinates on image, add each corner to array
                        
                        let cornerArray = [];
                        let colorChoice = (count >= FRAME_REQUIREMENT) ? [0, 255, 0, 255] : [255, 0, 0, 255];

                        for (var i = 1; i < approx.rows; i += 1) {
                            let prev_point = new cv.Point(approx.data32S[(i - 1)*2], approx.data32S[(i - 1)*2 + 1]);
                            let cur_point = new cv.Point(approx.data32S[(i)*2], approx.data32S[(i)*2 + 1]);
                            
                            // Scale up to original image dimensions
                            prev_point.x *= orig_padded.cols / src.cols;
                            prev_point.y *= orig_padded.rows / src.rows;
                            cur_point.x *= orig_padded.cols / src.cols;
                            cur_point.y *= orig_padded.rows / src.rows;

                            // Draw line, add to array
                            cv.line(orig_padded, prev_point, cur_point, colorChoice, 4);
                            cornerArray.push({corner: cur_point});
                        }
                        let prev_point = new cv.Point(approx.data32S[(approx.rows - 1)*2], approx.data32S[(approx.rows - 1)*2 + 1]);
                        let cur_point = new cv.Point(approx.data32S[(0)*2], approx.data32S[(0)*2 + 1]);

                        // Scale up to original image dimensions for final point
                        prev_point.x *= orig_padded.cols / src.cols;
                        prev_point.y *= orig_padded.rows / src.rows;
                        cur_point.x *= orig_padded.cols / src.cols;
                        cur_point.y *= orig_padded.rows / src.rows;

                        // Draw line for final point, add to array
                        cv.line(orig_padded, prev_point, cur_point, colorChoice, 4);
                        cornerArray.push({corner: cur_point});


                        
                        // Sort corners by y coordinate
                        cornerArray.sort((item1, item2) => { return (item1.corner.y < item2.corner.y) ? -1 : (item1.corner.y > item2.corner.y) ? 1 : 0; }).slice(0, 5);


                        //Determine left/right based on x position of top and bottom 2
                        let tl = cornerArray[0].corner.x < cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
                        let tr = cornerArray[0].corner.x > cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
                        let bl = cornerArray[2].corner.x < cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
                        let br = cornerArray[2].corner.x > cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];

                        //Calculate the max width/height
                        let widthBottom = Math.hypot(br.corner.x - bl.corner.x, br.corner.y - bl.corner.y);
                        let widthTop = Math.hypot(tr.corner.x - tl.corner.x, tr.corner.y - tl.corner.y);
                        let theWidth = (widthBottom > widthTop) ? widthBottom : widthTop;
                        let heightRight = Math.hypot(tr.corner.x - br.corner.x, tr.corner.y - br.corner.y);
                        let heightLeft = Math.hypot(tl.corner.x - bl.corner.x, tr.corner.y - bl.corner.y);
                        let theHeight = (heightRight > heightLeft) ? heightRight : heightLeft;


                        // Compute perspective transform of the segmented document
                        let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]); //
                        let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.corner.x, tl.corner.y, tr.corner.x, tr.corner.y, br.corner.x, br.corner.y, bl.corner.x, bl.corner.y]);
                        let dsize = new cv.Size(theWidth, theHeight);
                        let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords);
            
                        let finalDest = new cv.Mat(theHeight, theWidth, cv.CV_8UC4);
                        cv.warpPerspective(orig_padded, finalDest, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

                        

                        cv.cvtColor(finalDest, finalDest, cv.COLOR_RGBA2GRAY);
                        // cv.adaptiveThreshold(finalDest, finalDest, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 3, 4);
                        // cv.threshold(finalDest, finalDest, 120, 255, cv.THRESH_BINARY);

                        if (!lockImage) {
                            cv.imshow("canvasOutputProjected", finalDest);
                        }
                        contourFound = true;
                        
  
                        finalDest.delete();
                        
                        
                    }       

                }
                else {
                    if (verbose)
                        console.log("Irregular contour");
                }
                approx.delete();
            }
            else {
                if (verbose)
                    console.log("No Contours");
            }


            

            // // DUMMY RENDER FOR MOBILE 
            // /****>>>[I M P O R T A N T]<<<****/
            cv.imshow("canvasOutput", src); 
            // /****>>>-------------------<<<****/

            if (displaymode == 0){
                cv.imshow("canvasOutput2", orig_padded);
            }
            else if (displaymode == 1) {
                cv.imshow("canvasOutput2", src);
            }

            // Debug function
            setTimeout(function(){
                    let coutfinal = document.getElementById("canvasOutput2");
                    let coutinit = document.getElementById("canvasOutput2");
                    alert("initialOutput: (" + coutinit.style.width + " " + coutinit.style.height + ")");
            }, 1);

            // Update running count of frames with a contour found
            if (contourFound) {
                count += 1;
            }
            else {
                count = 0;
            }

            orig_padded.delete();
            src.delete();
            

            
            
            

            
        }
        let delay = 1000/FPS - (Date.now() - begin);
        if (scanRunning) {
            setTimeout(processVideo, delay);
        }
        // else {
            
        //     stopVideo();
              
        // }
    }

    function showVideo() {
        let begin = Date.now();
        if (video.videoHeight != 0) {

            let width = video.videoWidth;
            let height = video.videoHeight;
            let new_width = height / 9 * 16;

            

            if (!sized) {
                video.height = video.videoHeight;
                video.width = video.videoWidth;
                canvasFrame.height = height;
                canvasFrame.width = width;
                alert(height + "   " + width);
                sized = true;
            }

            contourFound = false;
            
            // Draw raw image on canvas
            context.drawImage(video, 0, 0, width, height);
            
            // Copy original video image into matrix
            let orig = new cv.Mat(height, width, cv.CV_8UC4);
            orig.data.set(context.getImageData(0, 0, width, height).data);
            

            // Create a padded version of the original, get rid of original
            let orig_padded = new cv.Mat();
            let diff = new_width - width;
            cv.copyMakeBorder(orig, orig_padded, 0, 0, diff/2, diff/2, cv.BORDER_CONSTANT, new cv.Scalar(163, 176, 212, 255));
            orig.delete();

            // Create a scaled down version of the padded original (to 240p 16:9)
            let prev_rows = orig_padded.rows;
            let scale = prev_rows / 240;
            let src = new cv.Mat();
            cv.resize(orig_padded, src, new cv.Size(240, 240/9*16), 0, 0, cv.INTER_AREA);

            // Convert src to grayscale
            cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

            // Apply thresholding to src
            let gray_mean = cv.mean(src)[0];
            cv.GaussianBlur(src, src, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
            cv.threshold(src, src, gray_mean + (255-gray_mean)*0.20, 255, cv.THRESH_BINARY);
            cv.GaussianBlur(src, src, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

            // Run canny edge detection
            cv.Canny(src, src, 30, 50, 3, false);


            // Delete below if it breaks lol

            /*********************/
            // Find contours
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            // Get area for all contours so we can find the biggest
            let sortableContours = [];
            for (let i = 0; i < contours.size(); i++) 
            {
                let cnt = contours.get(i);
                let area = cv.contourArea(cnt, false);
                let perim = cv.arcLength(cnt, false);

                sortableContours.push({ areaSize: area, perimiterSize: perim, contour: cnt });
            }
            sortableContours = sortableContours.sort((item1, item2) => { return (item1.areaSize > item2.areaSize) ? -1 : (item1.areaSize < item2.areaSize) ? 1 : 0; }).slice(0, 5);


            // Get bounding box of largest contour, draw bounding box
            if (sortableContours.length > 0) {

                // Get largest contour
                let cnt = sortableContours[0].contour;
                
                // Approximate polynomial bounding box of largest
                let approx = new cv.Mat();
                cv.approxPolyDP(sortableContours[0].contour, approx, .05 * sortableContours[0].perimiterSize, true);
                
                if (verbose)
                    console.log(cv.contourArea(cnt));

                // Check if contour area is sufficiently large [UPDATE THIS]
                if (cv.contourArea(cnt) > 3000) {
                    
                    // Check if the polynomial is a quadrilatreral
                    if (approx.rows == 4) {
                        
                        // Draw coordinates on image, add each corner to array
                        
                        let cornerArray = [];
                        let colorChoice = (count >= FRAME_REQUIREMENT) ? [0, 255, 0, 255] : [255, 0, 0, 255];

                        for (var i = 1; i < approx.rows; i += 1) {
                            let prev_point = new cv.Point(approx.data32S[(i - 1)*2], approx.data32S[(i - 1)*2 + 1]);
                            let cur_point = new cv.Point(approx.data32S[(i)*2], approx.data32S[(i)*2 + 1]);
                            
                            // Scale up to original image dimensions
                            prev_point.x *= orig_padded.cols / src.cols;
                            prev_point.y *= orig_padded.rows / src.rows;
                            cur_point.x *= orig_padded.cols / src.cols;
                            cur_point.y *= orig_padded.rows / src.rows;

                            // Draw line, add to array
                            cv.line(orig_padded, prev_point, cur_point, colorChoice, 4);
                            cornerArray.push({corner: cur_point});
                        }
                        let prev_point = new cv.Point(approx.data32S[(approx.rows - 1)*2], approx.data32S[(approx.rows - 1)*2 + 1]);
                        let cur_point = new cv.Point(approx.data32S[(0)*2], approx.data32S[(0)*2 + 1]);

                        // Scale up to original image dimensions for final point
                        prev_point.x *= orig_padded.cols / src.cols;
                        prev_point.y *= orig_padded.rows / src.rows;
                        cur_point.x *= orig_padded.cols / src.cols;
                        cur_point.y *= orig_padded.rows / src.rows;

                        // Draw line for final point, add to array
                        cv.line(orig_padded, prev_point, cur_point, colorChoice, 4);
                        cornerArray.push({corner: cur_point});


                        
                        // Sort corners by y coordinate
                        cornerArray.sort((item1, item2) => { return (item1.corner.y < item2.corner.y) ? -1 : (item1.corner.y > item2.corner.y) ? 1 : 0; }).slice(0, 5);


                        //Determine left/right based on x position of top and bottom 2
                        let tl = cornerArray[0].corner.x < cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
                        let tr = cornerArray[0].corner.x > cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
                        let bl = cornerArray[2].corner.x < cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
                        let br = cornerArray[2].corner.x > cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];

                        //Calculate the max width/height
                        let widthBottom = Math.hypot(br.corner.x - bl.corner.x, br.corner.y - bl.corner.y);
                        let widthTop = Math.hypot(tr.corner.x - tl.corner.x, tr.corner.y - tl.corner.y);
                        let theWidth = (widthBottom > widthTop) ? widthBottom : widthTop;
                        let heightRight = Math.hypot(tr.corner.x - br.corner.x, tr.corner.y - br.corner.y);
                        let heightLeft = Math.hypot(tl.corner.x - bl.corner.x, tr.corner.y - bl.corner.y);
                        let theHeight = (heightRight > heightLeft) ? heightRight : heightLeft;


                        // Compute perspective transform of the segmented document
                        let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]); //
                        let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.corner.x, tl.corner.y, tr.corner.x, tr.corner.y, br.corner.x, br.corner.y, bl.corner.x, bl.corner.y]);
                        let dsize = new cv.Size(theWidth, theHeight);
                        let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords);
            
                        let finalDest = new cv.Mat(theHeight, theWidth, cv.CV_8UC4);
                        cv.warpPerspective(orig_padded, finalDest, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

                        

                        cv.cvtColor(finalDest, finalDest, cv.COLOR_RGBA2GRAY);
                        // cv.adaptiveThreshold(finalDest, finalDest, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 3, 4);
                        // cv.threshold(finalDest, finalDest, 120, 255, cv.THRESH_BINARY);

                        if (!lockImage) {
                            cv.imshow("canvasOutputProjected", finalDest);
                        }
                        contourFound = true;
                        
  
                        finalDest.delete();
                        
                        
                    }       

                }
                else {
                    if (verbose)
                        console.log("Irregular contour");
                }
                approx.delete();
            }
            else {
                if (verbose)
                    console.log("No Contours");
            }


            /*********************/






            if (displaymode == 0){
                cv.imshow("canvasOutput2", orig_padded);
            }
            else if (displaymode == 1) {
                cv.imshow("canvasOutput2", src);
            }

            if (contourFound) {
                count += 1;
            }
            else {
                count = 0;
            }


            
            src.delete();
            orig_padded.delete();

        }
        let delay = 1000/FPS - (Date.now() - begin);
        setTimeout(showVideo, delay);
    }
    
    navigator.mediaDevices.getUserMedia({ video: vidOptions, audio: false }).then(function(stream) {
        // video.src = stream;
        video.srcObject = stream;
        video.play();
        alert(video.src);
        
        
        
        // setTimeout(processVideo, 0);
        setTimeout(showVideo(), 0);
    });
    

   
    
}

function manualcode(link) {
    var canvas = document.getElementById("canvasOutput2");
    canvas.style.height = "100%";
    canvas.style.height = "100%";
    var ctx = canvas.getContext("2d");

    try {
        var image = new Image();
        image.onload = function() {
            ctx.drawImage(image, 0, 0);
        };
        image.src = link;
    }
    catch (error) {
        alert(error);
    }
   
}

function onOpenCvReady(isIOS, isTrainMode) {

    console.log("Running opencv loop!", cv);
    alert("isTrainMode " + isTrainMode);
    
        
    scanRunning = true;

    // manualcode(link);
    cvcode(isIOS);
    
    
     
}