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

import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { AcuStock } from './app.component';

import { LoginPageModule } from '../pages/login/login.module';
import { PickShipmentsPage } from '../pages/pick-shipments/pick-shipments';
import { ItemLookupPage } from '../pages/item-lookup/item-lookup';
import { BinLookupPage } from '../pages/bin-lookup/bin-lookup';
import { SetupPageModule } from '../pages/setup/setup.module';

import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { AppPreferences } from '@ionic-native/app-preferences';
import { Vibration } from '@ionic-native/vibration';
import { EmailComposer } from '@ionic-native/email-composer';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AutoCompleteModule } from 'ionic2-auto-complete';

import { Api, CacheProvider, BarcodeListenerComponent, ItemAutocompleteService, LocationAutocompleteService, PickProvider, PreferencesProvider } from '../providers/providers';
import { HTTP } from '@ionic-native/http';
import { HttpModule } from '@angular/http'
import { ItemLookupDetailsPage } from "../pages/item-lookup-details/item-lookup-details";
import { PickShipmentsListPage } from "../pages/pick-shipments/list/pick-shipments-list";
import { PickShipmentsPickPage } from "../pages/pick-shipments/pick/pick-shipments-pick";
import { PickTab} from "../pages/pick-shipments/pick/tabs/pick";
import { PickListTab } from "../pages/pick-shipments/pick/tabs/pick-list";
import { UnpickedListTab } from "../pages/pick-shipments/pick/tabs/unpicked-list";
import { PreferencesPage } from "../pages/preferences/preferences";
import { BinTransferPage } from "../pages/bin-transfer/bin-transfer";
import { TransferProvider } from "../providers/app/transfer";
import { EnterTabModule } from "../pages/bin-transfer/tabs/enter.module";
import { TransferListTab } from "../pages/bin-transfer/tabs/transfer-list";
import { ReceiveProvider } from '../providers/app/receive';
import { ReceivePage } from "../pages/receive/receive";
import { ReceiveShipmentPage } from "../pages/receive/shipment/receive-shipment";
import { ReceiveShipmentListTab } from "../pages/receive/shipment/tabs/list";
import { ReceiveShipmentPendingTab } from "../pages/receive/shipment/tabs/pending";
import { ReceiveShipmentEnterTab } from "../pages/receive/shipment/tabs/shipment-enter";
import { CountPage } from '../pages/count/count';
import { CountEntryPage } from '../pages/count/entry/count-entry';
import { CountEntryEnterTab } from '../pages/count/entry/tabs/count-enter';
import { CountEntryListTab } from '../pages/count/entry/tabs/count-list';
import { CountEntryPendingTab } from '../pages/count/entry/tabs/pending-list';
import { CountProvider } from "../providers/app/count";
import { UtilsProvider } from "../providers/core/utils";
import { AdjustmentPage } from "../pages/adjustment/adjustment";
import { AdjustmentEnterTab } from "../pages/adjustment/tabs/adjustment-enter";
import { AdjustmentListTab } from "../pages/adjustment/tabs/adjustment-list";
import {AdjustmentProvider} from "../providers/app/adjustment";
import { AboutPage } from "../pages/about/about";

@NgModule({
    declarations: [
        AcuStock,
        BinTransferPage,
        TransferListTab,
        PickShipmentsPage,
        PickShipmentsListPage,
        PickShipmentsPickPage,
        PickTab,
        PickListTab,
        UnpickedListTab,
        ItemLookupPage,
        ItemLookupDetailsPage,
        BinLookupPage,
        ReceivePage,
        ReceiveShipmentPage,
        ReceiveShipmentListTab,
        ReceiveShipmentPendingTab,
        ReceiveShipmentEnterTab,
        CountPage,
        CountEntryPage,
        CountEntryEnterTab,
        CountEntryListTab,
        CountEntryPendingTab,
        AdjustmentPage,
        AdjustmentEnterTab,
        AdjustmentListTab,
        TransferListTab,
        PreferencesPage,
        BarcodeListenerComponent,
        AboutPage
    ],
    imports: [
        BrowserModule,
        HttpModule,
        AutoCompleteModule,
        IonicModule.forRoot(AcuStock),
        LoginPageModule,
        SetupPageModule,
        EnterTabModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        AcuStock,
        BinTransferPage,
        TransferListTab,
        PickShipmentsPage,
        PickShipmentsListPage,
        PickShipmentsPickPage,
        PickTab,
        PickListTab,
        UnpickedListTab,
        ItemLookupPage,
        ItemLookupDetailsPage,
        BinLookupPage,
        ReceivePage,
        ReceiveShipmentPage,
        ReceiveShipmentListTab,
        ReceiveShipmentPendingTab,
        ReceiveShipmentEnterTab,
        CountPage,
        CountEntryPage,
        CountEntryEnterTab,
        CountEntryListTab,
        CountEntryPendingTab,
        AdjustmentPage,
        AdjustmentEnterTab,
        AdjustmentListTab,
        PreferencesPage,
        AboutPage
    ],
    providers: [
        StatusBar,
        SplashScreen,
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        AppPreferences,
        BarcodeScanner,
        Api,
        HTTP,
        CacheProvider,
        ItemAutocompleteService,
        LocationAutocompleteService,
        PickProvider,
        TransferProvider,
        CountProvider,
        PreferencesProvider,
        UtilsProvider,
        ReceiveProvider,
        AdjustmentProvider,
        Vibration,
        EmailComposer
    ]
})
export class AppModule {
}