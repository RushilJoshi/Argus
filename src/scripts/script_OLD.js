
// let imgElement = document.getElementById('imageSrc');
// let inputElement = document.getElementById('fileInput');
// inputElement.addEventListener('change', (e) => {
// imgElement.src = URL.createObjectURL(e.target.files[0]);
// }, false);
// imgElement.onload = function() {
// let mat = cv.imread(imgElement);
// cv.imshow('canvasOutput', mat);
// mat.delete();
// };

var displaymode = 0;
var count = 0;
var contourFound = false;

let FRAME_REQUIREMENT = 5;
let verbose = false;
const { createWorker, createScheduler } = Tesseract;
const scheduler = createScheduler();

var payload_global = {};


function captureDocument() {
    if (contourFound) {
        alert("Frame found!");
        doOCR();
    }
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

const doOCR = async () => {
    let c = document.getElementById("canvasOutputProjected");
    const { data: { blocks } } = await scheduler.addJob('recognize', c);
    console.log(blocks);
};

(async () => {
    console.log('Initializing Tesseract.js');
    for (let i = 0; i < 4; i++) {
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        scheduler.addWorker(worker);
    }
    console.log('Initialized Tesseract.js');
})();






function cvcode(isIOS) {

    // Get video from media
    let video = document.getElementById("videoInput"); // video is the id of video tag

    let vidOptions = isIOS ? {facingMode: { exact: "environment" }} : true;

    
    console.log("LOGGING MEDIA DEVICES:");
    console.log(navigator.mediaDevices.enumerateDevices());
    
    
    // Get HTML elements, set constants

    let canvasFrame = document.getElementById("canvasOutput"); // canvasFrame is the id of <canvas>
    let context = canvasFrame.getContext("2d");
    const FPS = 15;

    // Process video
    function processVideo() {
        let begin = Date.now();
        if (video.videoHeight != 0) {

            let width = video.videoWidth;
            let height = video.videoHeight;

            contourFound = false;
            

            // Draw raw image on canvas
            context.drawImage(video, 0, 0, width, height);
            
            // Copy original video image into matrix
            let orig = new cv.Mat(height, width, cv.CV_8UC4);
            orig.data.set(context.getImageData(0, 0, width, height).data);

            let black_color = new cv.Scalar(0, 0, 0, 255);
            let new_height = height;
            let new_width = width + 25 * 2
            let orig_bordered = new cv.Mat(new_height, new_width, cv.CV_8UC4);
            cv.copyMakeBorder(orig, orig_bordered, 0, 0, 25, 25, cv.BORDER_CONSTANT, black_color);
            
            

            //cv.resize(orig, orig, new cv.Size(width, height), 0, 0, cv.INTER_AREA);
            

            // Convert to gray
            let src = new cv.Mat(new_height, new_width, cv.CV_8UC4);
            cv.cvtColor(orig, src, cv.COLOR_RGBA2GRAY);
            
            // Apply thresholding and blur
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
                let cnt = sortableContours[0].contour;

                let approx = new cv.Mat();
                cv.approxPolyDP(sortableContours[0].contour, approx, .05 * sortableContours[0].perimiterSize, true);
                
                if (verbose)
                    console.log(cv.contourArea(cnt));

                if (cv.contourArea(cnt) > 30000) {
                    if (approx.rows == 4) {
                        let cornerArray = [];
                        let colorChoice = (count >= FRAME_REQUIREMENT) ? [0, 255, 0, 255] : [255, 0, 0, 255];
                        for (var i = 1; i < approx.rows; i += 1) {
                            let prev_point = new cv.Point(approx.data32S[(i - 1)*2], approx.data32S[(i - 1)*2 + 1]);
                            let cur_point = new cv.Point(approx.data32S[(i)*2], approx.data32S[(i)*2 + 1]);
                            cv.line(orig, prev_point, cur_point, colorChoice, 4);
                            cornerArray.push({corner: cur_point});
                        }
                        let prev_point = new cv.Point(approx.data32S[(approx.rows - 1)*2], approx.data32S[(approx.rows - 1)*2 + 1]);
                        let cur_point = new cv.Point(approx.data32S[(0)*2], approx.data32S[(0)*2 + 1]);
                        cv.line(orig, prev_point, cur_point, colorChoice, 4);
                        cornerArray.push({corner: cur_point});

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

                        // console.log("AREA", cv.contourArea(cnt));
                        

                        let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]); //
                        let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.corner.x, tl.corner.y, tr.corner.x, tr.corner.y, br.corner.x, br.corner.y, bl.corner.x, bl.corner.y]);
                        let dsize = new cv.Size(theWidth, theHeight);
                        let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords);
            
                        let finalDest = new cv.Mat(theHeight, theWidth, cv.CV_8UC4);
                        cv.warpPerspective(orig, finalDest, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());


                        cv.cvtColor(finalDest, finalDest, cv.COLOR_RGBA2GRAY);
                        // cv.adaptiveThreshold(finalDest, finalDest, 200, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 3, 2);
                        // cv.threshold(finalDest, finalDest, 120, 255, cv.THRESH_BINARY);


                        cv.imshow("canvasOutputProjected", finalDest);
                        contourFound = true;
                        
                        let finalWidth = finalDest.size().width;
                        let finalHeight = finalDest.size().height;

                        let ratio = finalWidth/finalHeight;
                        
                        // if (ratio > 1) {
                            
                        // }

                        // DELETE EVERYTHING
                        finalDest.delete();
                        approx.delete();
                        
                    }       

                }
                else {
                    if (verbose)
                        console.log("Irregular contour");
                }
            }
            else {
                if (verbose)
                    console.log("No Contours");
            }

            // Display image
            cv.imshow("canvasOutput", src); // Dummy render for mobile
            
            if (displaymode == 0){
                cv.imshow("canvasOutput2", orig);
            }
            else if (displaymode == 1) {
                cv.imshow("canvasOutput2", src);
            }

            // Update running count of frames with a contour found
            if (contourFound) {
                count += 1;
            }
            else {
                count = 0;
            }
            


            // Clean matrices
            orig.delete();
            src.delete();
            contours.delete();
            hierarchy.delete();
            

            
            
        }
        // Mark framerate, re-loop
        let delay = 1000/FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
    }
    navigator.mediaDevices.getUserMedia({ video: vidOptions, audio: false }).then(function(stream) {
        video.srcObject = stream;
        video.play();
        // video.style.display = "block";
        setTimeout(processVideo, 0);
    });
    
}

function onOpenCvReady(isIOS) {

    console.log("Running opencv loop!", cv);
    // cv['onRuntimeInitialized']=()=>{
        // document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
    cvcode(isIOS);
    //   };
     
}