import {Scroll} from './scroll';
import {Thumbnail} from './thumbnail';
import {Single} from "./image";
import {Flip} from './flip';
import {PlainText} from './plaintext';

var View = {};
View.Scroll = Scroll;
View.Thumbnail = Thumbnail;
View.Single = Single;
View.Flip = Flip;
View.PlainText = PlainText;

View.for = function(view) {
  if ( view == '1up' ) { return Scroll; }
  else if ( view == 'thumb' ) { return Thumbnail; }
  else if ( view == 'image' ) { return Single; }
  else if ( view == '2up' ) { return Flip; }
  else if ( view == 'text' || view == 'plaintext' ) { return PlainText; }
}

export {View};
