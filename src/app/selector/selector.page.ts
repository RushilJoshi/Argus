import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { ScannerPage } from '../scanner/scanner.page';

declare function onSelectorReady(data, isTrainMode);

@Component({
  selector: 'app-selector',
  templateUrl: './selector.page.html',
  styleUrls: ['selector.page.scss'],
})
export class SelectorPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    console.log("DONE!");
    var obtainedData = this.router.getCurrentNavigation().extras.state; // should log out 'bar'
    var isTrainMode = this.router.getCurrentNavigation().extras.state.isTrainMode;
    onSelectorReady(obtainedData, isTrainMode);

  }

  switchToScan(){
    this.router.navigate(["scanner"]);
  }

}
