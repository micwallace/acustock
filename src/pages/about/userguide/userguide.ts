/*
 * This file is part of AcuStock
 * Copyright (c) 2018 Michael B Wallace
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content } from 'ionic-angular';
declare function require(moduleName: string): any;
const { version : appVersion, versionType: versionType } = require('../../../../package.json');

@IonicPage()
@Component({
    selector: 'page-userguide',
    templateUrl: 'userguide.html',
})
export class UserguidePage {

    @ViewChild(Content) content: Content;

    public appVersion;

    public expand = null;

    constructor(public navCtrl:NavController, public navParams:NavParams) {
        this.appVersion = appVersion + (versionType!="stable" ? versionType : "");
        if (this.navParams.get('active'))
            this.expand = this.navParams.get('active');
    }

    ionViewDidLoad(){
        if (this.expand != null) {
            let yOffset = document.getElementById(this.expand).offsetTop;
            this.content.getScrollElement().scrollTo(0, yOffset);
        }
    }

}
