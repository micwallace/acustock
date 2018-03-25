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

import { Api, CacheProvider, BarcodeListenerComponent, ItemAutocompleteService, LocationAutocompleteService } from '../providers/providers';
import { HTTP } from '@ionic-native/http';
import { ItemLookupDetailsPage } from "../pages/item-lookup-details/item-lookup-details";

@NgModule({
    declarations: [
        MyApp,
        HomePage,
        LoginPage,
        PickShipmentsPage,
        ItemLookupPage,
        ItemLookupDetailsPage,
        BinLookupPage,
        SetupPage,
        BarcodeListenerComponent
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
        PickShipmentsPage,
        ItemLookupPage,
        ItemLookupDetailsPage,
        BinLookupPage,
        SetupPage,
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
    ]
})
export class AppModule {
}