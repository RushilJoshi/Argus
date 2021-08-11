import { Component } from '@angular/core';
import {Platform} from '@ionic/angular';
import {Router} from '@angular/router';


declare var cordova;
declare function onOpenCvReady(isIOS);

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(public platform: Platform, private router: Router) { }



  onScanClicked3(){
    this.router.navigate(["scanner"]);
  }

}
