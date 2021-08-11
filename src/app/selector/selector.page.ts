import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { ScannerPage } from '../scanner/scanner.page';

declare function onSelectorReady(data);

@Component({
  selector: 'app-selector',
  templateUrl: './selector.page.html',
  styleUrls: [],
})
export class SelectorPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    console.log("DONE!");
    var obtainedData = this.router.getCurrentNavigation().extras.state; // should log out 'bar'
    onSelectorReady(obtainedData);

  }

  switchToScan(){
    this.router.navigate(["scanner"]);
  }

}
