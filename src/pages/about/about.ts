import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
declare function require(moduleName: string): any;
const { version : appVersion } = require('../../../package.json');

/**
 * Generated class for the PreferencesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-about',
    templateUrl: 'about.html',
})
export class AboutPage {

    public appVersion;

    constructor(public navCtrl:NavController, public navParams:NavParams) {
        this.appVersion = appVersion
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad AboutPage');
    }

}
