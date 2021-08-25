import { Component, OnInit, HostListener, Inject, AfterViewInit} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {Platform} from '@ionic/angular';
import {NavigationEnd, Router} from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: "AIzaSyD9DX-KNwXr48qvphZJ6rTWyQjTOrB9oEI",
  authDomain: "eis-ocr-db.firebaseapp.com",
  projectId: "eis-ocr-db",
  storageBucket: "eis-ocr-db.appspot.com",
  messagingSenderId: "629004783589",
  appId: "1:629004783589:web:358c37262a0512afef290c",
  measurementId: "G-ETC06HN8BC"
};

const app = initializeApp(firebaseConfig);
const firebasedb = getFirestore(app);
console.log(firebasedb);


declare var cordova;
declare var payload_global;
declare var url_global;
declare var lockImage;
declare var scanRunning;
declare var sized;
declare function onOpenCvReady(isIOS, link, firebasedb);
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
  tm = false;


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
    var isTrainMode = this.router.getCurrentNavigation().extras.state.isTrainMode;
    this.tm = isTrainMode;


    if (isIOS) {
      cordova.plugins.iosrtc.registerGlobals();
    }
    console.log("Method!");
    // let video = <HTMLVideoElement>document.getElementById("videoInput");
    
    onOpenCvReady(isIOS, isTrainMode, firebasedb);
    
  }

  switchToSelect() {

    if (lockImage && payload_global != {}) {
        console.log("Moving contours and switching!");
        
        discardProjection();
        this.router.navigate(["selector"], { state: { data: payload_global, url:url_global, isTrainMode: this.tm} });
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
