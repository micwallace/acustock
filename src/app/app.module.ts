import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { PickShipmentsPage } from '../pages/pick-shipments/pick-shipments';
import { ItemLookupPage } from '../pages/item-lookup/item-lookup';
import { BinLookupPage } from '../pages/bin-lookup/bin-lookup';
import { SetupPage } from '../pages/setup/setup';

import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { AppPreferences } from '@ionic-native/app-preferences';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AutoCompleteModule } from 'ionic2-auto-complete';

import { Api, CacheProvider, BarcodeListenerComponent, ItemAutocompleteService, LocationAutocompleteService, PickProvider, PreferencesProvider } from '../providers/providers';
import { HTTP } from '@ionic-native/http';
import { ItemLookupDetailsPage } from "../pages/item-lookup-details/item-lookup-details";
import { PickShipmentsListPage } from "../pages/pick-shipments-list/pick-shipments-list";
import { PickShipmentsPickPage } from "../pages/pick-shipments-pick/pick-shipments-pick";
import { PickTab} from "../pages/pick-shipments-pick/tabs/pick";
import { PickListTab } from "../pages/pick-shipments-pick/tabs/pick-list";
import { UnpickedListTab } from "../pages/pick-shipments-pick/tabs/unpicked-list";
import { PreferencesPage } from "../pages/preferences/preferences";
import { BinTransferPage } from "../pages/bin-transfer/bin-transfer";
import { TransferProvider } from "../providers/transfer/transfer";
import { EnterTab } from "../pages/bin-transfer/tabs/enter";
import { TransferListTab } from "../pages/bin-transfer/tabs/transfer-list";
import { TransferHistoryTab } from "../pages/bin-transfer/tabs/transfer-history";
import { ReceiveProvider } from '../providers/receive/receive';
import { ReceivePage } from "../pages/receive/receive";

@NgModule({
    declarations: [
        MyApp,
        HomePage,
        LoginPage,
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
        SetupPage,
        PreferencesPage,
        BarcodeListenerComponent,
    ],
    imports: [
        BrowserModule,
        AutoCompleteModule,
        IonicModule.forRoot(MyApp),
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        LoginPage,
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
        PreferencesProvider,
    ReceiveProvider
    ]
})
export class AppModule {
}