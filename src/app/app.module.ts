import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { LoginPageModule } from '../pages/login/login.module';
import { PickShipmentsPage } from '../pages/pick-shipments/pick-shipments';
import { ItemLookupPage } from '../pages/item-lookup/item-lookup';
import { BinLookupPage } from '../pages/bin-lookup/bin-lookup';
import { SetupPage } from '../pages/setup/setup';

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
import { EnterTab } from "../pages/bin-transfer/tabs/enter";
import { TransferListTab } from "../pages/bin-transfer/tabs/transfer-list";
import { TransferHistoryTab } from "../pages/bin-transfer/tabs/transfer-history";
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

@NgModule({
    declarations: [
        MyApp,
        BinTransferPage,
        EnterTab,
        TransferListTab,
        TransferHistoryTab,
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
        SetupPage,
        PreferencesPage,
        BarcodeListenerComponent,
    ],
    imports: [
        BrowserModule,
        HttpModule,
        AutoCompleteModule,
        IonicModule.forRoot(MyApp),
        LoginPageModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        BinTransferPage,
        EnterTab,
        TransferListTab,
        TransferHistoryTab,
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
        SetupPage,
        PreferencesPage
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
        Vibration,
        EmailComposer
    ]
})
export class AppModule {
}