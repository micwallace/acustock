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

import { NgModule, ErrorHandler, Injectable, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { AcuStock } from './app.component';

import { LoginPageModule } from '../pages/login/login.module';
import { PickShipmentsPage } from '../pages/pick-shipments/pick-shipments';
import { ItemLookupPage } from '../pages/item-lookup/item-lookup';
import { BinLookupPage } from '../pages/bin-lookup/bin-lookup';
import { SetupPageModule } from '../pages/setup/setup.module';

import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Vibration } from '@ionic-native/vibration';
import { EmailComposer } from '@ionic-native/email-composer';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AutoCompleteModule } from 'ionic2-auto-complete';

import { Api, CacheProvider, ItemAutocompleteService, LocationAutocompleteService, PickProvider, PreferencesProvider } from '../providers/providers';
import { HTTP } from '@ionic-native/http';
import { HttpModule } from '@angular/http'
import { ItemLookupDetailsPage } from "../pages/item-lookup-details/item-lookup-details";
import { PickDetailsListPage } from "../pages/pick-shipments/details/pick-details-list";
import { PickShipmentsPickPage } from "../pages/pick-shipments/pick/pick-shipments-pick";
import { PickTab} from "../pages/pick-shipments/pick/tabs/pick";
import { PickListTab } from "../pages/pick-shipments/pick/tabs/pick-list";
import { UnpickedListTab } from "../pages/pick-shipments/pick/tabs/unpicked-list";
import { PreferencesPage } from "../pages/preferences/preferences";
import { BinTransferPage } from "../pages/bin-transfer/bin-transfer";
import { TransferPopover } from "../pages/bin-transfer/transfer-popover";
import { TransferProvider } from "../providers/app/transfer";
import { EnterTab } from "../pages/bin-transfer/tabs/enter";
import { TransferListTab } from "../pages/bin-transfer/tabs/transfer-list";
import { ReceiveProvider } from '../providers/app/receive';
import { ReceivePage } from "../pages/receive/receive";
import { ReceivePopover } from "../pages/receive/receive-popover";
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
import { AdjustmentPopover } from "../pages/adjustment/adjustment-popover";
import { AdjustmentEnterTab } from "../pages/adjustment/tabs/adjustment-enter";
import { AdjustmentListTab } from "../pages/adjustment/tabs/adjustment-list";
import { AdjustmentProvider } from "../providers/app/adjustment";
import { AboutPage } from "../pages/about/about";
import { BarcodeListenerComponentModule } from "../components/barcode-listener/barcode-listener.module";
import { UserguidePage } from "../pages/about/userguide/userguide";
import { AccordionListComponentModule } from "../components/accordion-list/accordion-list.module";
import { PickPopover } from "../pages/pick-shipments/pick-popover";
import { LookupsPopover } from "../pages/bin-lookup/lookups-popover";
import { CountPopover } from "../pages/count/count-popover";
import { PreferencesPopover } from "../pages/preferences/preferences-popover";
import { QRPage } from "../pages/preferences/qr/qr";
import { QRCodeModule } from "angularx-qrcode";
import { SocialSharing } from '@ionic-native/social-sharing';
import { Pro } from '@ionic/pro';
import { ItemSerialsPage } from "../pages/item-lookup-details/serials/item-serials";
import { ItemAllocationsPage } from "../pages/item-lookup-details/allocations/item-allocations";
import { PickShipmentsListPage } from "../pages/pick-shipments/list/pick-shipments-list";

declare function require(moduleName: string): any;
const { version : appVersion } = require('../../package.json');

Pro.init('cb4667f2', {
    appVersion: appVersion
});

@Injectable()
export class MyErrorHandler implements ErrorHandler {
    ionicErrorHandler: IonicErrorHandler;

    constructor(injector: Injector) {
        try {
            this.ionicErrorHandler = injector.get(IonicErrorHandler);
        } catch(e) {
            // Unable to get the IonicErrorHandler provider, ensure
            // IonicErrorHandler has been added to the providers list below
        }
    }

    handleError(err: any): void {
        //noinspection TypeScriptUnresolvedVariable
        Pro.monitoring.handleNewError(err);
        // Remove this if you want to disable Ionic's auto exception handling
        // in development mode.
        this.ionicErrorHandler && this.ionicErrorHandler.handleError(err);
    }
}

@NgModule({
    declarations: [
        AcuStock,
        BinTransferPage,
        TransferPopover,
        TransferListTab,
        EnterTab,
        TransferListTab,
        PickShipmentsPage,
        PickPopover,
        PickShipmentsListPage,
        PickDetailsListPage,
        PickShipmentsPickPage,
        PickTab,
        PickListTab,
        UnpickedListTab,
        ItemLookupPage,
        LookupsPopover,
        ItemLookupDetailsPage,
        ItemSerialsPage,
        ItemAllocationsPage,
        BinLookupPage,
        ReceivePage,
        ReceivePopover,
        ReceiveShipmentPage,
        ReceiveShipmentListTab,
        ReceiveShipmentPendingTab,
        ReceiveShipmentEnterTab,
        CountPage,
        CountPopover,
        CountEntryPage,
        CountEntryEnterTab,
        CountEntryListTab,
        CountEntryPendingTab,
        AdjustmentPage,
        AdjustmentPopover,
        AdjustmentEnterTab,
        AdjustmentListTab,
        PreferencesPage,
        PreferencesPopover,
        QRPage,
        AboutPage,
        UserguidePage
    ],
    imports: [
        BrowserModule,
        HttpModule,
        AutoCompleteModule,
        IonicModule.forRoot(AcuStock),
        LoginPageModule,
        SetupPageModule,
        BarcodeListenerComponentModule,
        AccordionListComponentModule,
        QRCodeModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        AcuStock,
        BinTransferPage,
        TransferPopover,
        TransferListTab,
        EnterTab,
        TransferListTab,
        PickShipmentsPage,
        PickPopover,
        PickShipmentsListPage,
        PickDetailsListPage,
        PickShipmentsPickPage,
        PickTab,
        PickListTab,
        UnpickedListTab,
        ItemLookupPage,
        LookupsPopover,
        ItemLookupDetailsPage,
        ItemAllocationsPage,
        ItemSerialsPage,
        BinLookupPage,
        ReceivePage,
        ReceivePopover,
        ReceiveShipmentPage,
        ReceiveShipmentListTab,
        ReceiveShipmentPendingTab,
        ReceiveShipmentEnterTab,
        CountPage,
        CountPopover,
        CountEntryPage,
        CountEntryEnterTab,
        CountEntryListTab,
        CountEntryPendingTab,
        AdjustmentPage,
        AdjustmentPopover,
        AdjustmentEnterTab,
        AdjustmentListTab,
        PreferencesPage,
        PreferencesPopover,
        QRPage,
        AboutPage,
        UserguidePage
    ],
    providers: [
        StatusBar,
        SplashScreen,
        BarcodeScanner,
        SocialSharing,
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
        EmailComposer,
        IonicErrorHandler,
        { provide: ErrorHandler, useClass: MyErrorHandler }
    ]
})

export class AppModule {
}