import { Component, OnInit, HostListener, Inject, AfterViewInit} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {Platform} from '@ionic/angular';
import {NavigationEnd, Router} from '@angular/router';





declare var cordova;
declare var payload_global;
declare var url_global;
declare var lockImage;
declare var scanRunning;
declare var sized;
declare function onOpenCvReady(isIOS);
declare function stopVideo();
declare function discardProjection();

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
})
export class ScannerPage implements OnInit {

  canvasWidth = 640;
  canvasHeight = 480;


  constructor(public platform: Platform, @Inject(DOCUMENT) document, private router: Router) { 

    this.router.events.subscribe(event =>{
      if (event instanceof NavigationEnd) {
        if (event.url == "/scanner") {

          alert("Scanner reached");
          window.dispatchEvent(new Event('resize'));
          scanRunning = true;
          lockImage = false;
          this.startScanning();
        }
      }
      
   })

  }

  ngOnInit() {
    console.log("Scanner page initialized!");
    
  }


  startScanning() {
    var isIOS = this.platform.is("ios");
    if (isIOS) {
      cordova.plugins.iosrtc.registerGlobals();
    }
    console.log("Method!");
    // let video = <HTMLVideoElement>document.getElementById("videoInput");
    
    onOpenCvReady(isIOS);
    
  }

  switchToSelect() {
    if (lockImage && payload_global != {}) {
        console.log("Moving contours and switching!");
        
        discardProjection();
        this.router.navigate(["selector"], { state: { data: payload_global, url:url_global} });
    }
    else {
        console.log("You must capture a frame first");
    }
  }
  switchToHome() {
    
    sized = false;
    this.router.navigate(["home"]);
  }



  @HostListener('window:resize', ['$event'])
  onResize(event) {
    // console.log(event.target.innerWidth, event.target.innerHeight);
    var out = document.getElementById("canvasOutput2");
    if (out) {

        if (event.target.innerWidth / event.target.innerHeight < 16/9) {
          this.canvasHeight = (event.target.innerWidth * 9 / 16);
          this.canvasWidth = (event.target.innerWidth);
        }
        else {
          this.canvasHeight  = (event.target.innerHeight);
          this.canvasWidth = (event.target.innerHeight / 9 * 16);
        }

        console.log("RESIZED", this.canvasHeight, this.canvasWidth);
    }
 }

}
