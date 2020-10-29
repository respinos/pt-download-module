import {Navigator} from './navigator';
import {Paginator} from '../../../components/controls/paginator';
import {Viewinator} from '../../../components/controls/viewinator';
import {Zoominator} from './zoominator';
// import {Rotator} from './rotator';
import {Contentsnator} from './contentsnator'
// import {Selectinator} from './selectinator'
import {Expandinator} from '../../../components/controls/expandinator';
import {Flexinator} from '../../../components/controls/flexinator';
import {Highlighter} from './highlighter';
import {Searchinator} from './searchinator';

var Control = {};
Control.Navigator = Navigator;
Control.Paginator = Paginator;
Control.Expandinator = Expandinator;
Control.Flexinator = Flexinator;
Control.Viewinator = Viewinator;
Control.Zoominator = Zoominator;
Control.Highlighter = Highlighter;
Control.Contentsnator = Contentsnator;
Control.Searchinator = Searchinator;

export {Control};
