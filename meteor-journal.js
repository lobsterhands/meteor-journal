var Entries = new Mongo.Collection('entries');
// @lyle on the live demo, the window is loading before the Entries database
// is able to be read. Is there an event triggered when connection is ready?

if (Meteor.isClient) {

  var newEditorOptions = function( divId, loadText ) {
    return opts = {
      container: divId,
      textarea: null,
      basePath: '/epiceditor',
      clientSideStorage: false, // false means browser pulls text from database
      localStorageName: null,
      useNativeFullscreen: true,
      parser: marked,
      file: {
        name: null,
        defaultContent: loadText,
        autoSave: 100
      },
      theme: {
        base: '/themes/base/epiceditor.css',
        preview: '/themes/preview/github.css',
        editor: '/themes/editor/epic-dark.css'
      },
      button: {
        preview: true,
        fullscreen: true,
        bar: "auto"
      },
      focusOnLoad: false,
      shortcut: {
        modifier: 18,
        fullscreen: 70,
        preview: 80
      },
      string: {
        togglePreview: 'Toggle Preview Mode',
        toggleEdit: 'Toggle Edit Mode',
        toggleFullscreen: 'Enter Fullscreen'
      },
      autogrow: false
    };
  };

  var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var date = new Date();
  var year = date.getFullYear().toString();
  var monthName = monthNames[date.getMonth()];
  var monthFileName = (date.getMonth() + 1).toString();
  var dayFileName = date.getDate().toString();
  var dateString = monthName + ' ' + dayFileName + ', ' + year;
  // Add a zero in front of single day/months for ordered filing
  if (dayFileName < 10) {
    dayFileName = '0' + dayFileName;
  }
  if (monthFileName < 10) {
    monthFileName = '0' + monthFileName;
  }

  // yyyymmdd
  var currentDate = year + monthFileName + dayFileName;

  var todayEditor;
  var todayDefaultContent;
  var priorEntryEditor;
  var priorEntryDate;   // Usage: get text from this db date search


  function unloadEditor() {
    if (Session.get('todayEditor-loaded')) {
      todayEditor.unload();
      document.getElementById('epiceditor').style.display = 'none';
      Session.set('todayEditor-loaded', false);
    }
  }

  function unloadViewEntryEditor() {
    if (Session.get('priorEntryEditor-loaded')) {
      priorEntryEditor.unload();
      document.getElementById('epiceditor-view-entries').style.display = 'none';
      Session.set('priorEntryEditor-loaded', false);
    }
  }

  // BODY TEMPLATE
  Template.body.events({

    'click .btn-today-entry': function() {
      Session.set('new-entry', !Session.get('new-entry'));

      if (Session.get('priorEntryEditor-loaded')) {
        unloadViewEntryEditor();
        Session.set('view-entries', false);
      }

      // Set default content for today's journal entry
      var getTodayEntry = Entries.findOne( {title: currentDate });
      if (getTodayEntry !== undefined) {
        todayDefaultContent = getTodayEntry.text;
        //console.log('Entry is found. Default text should read: ' + getTodayEntry.text);
      } else {
        todayDefaultContent = '##' + dateString + '\n\n\n';
        //console.log('Entry is not found. Default text should read: ##' + dateString);
      }

      if (Session.get('new-entry')) {
        var editorOptions = newEditorOptions('epiceditor', todayDefaultContent);
        // Display the todayEditor div and load the todayEditor using options set above
        document.getElementById('epiceditor').style.display = 'block';
        todayEditor = new EpicEditor(editorOptions).load();
        Session.set('todayEditor-loaded', true);
      } else {
        unloadEditor();
      }
    },

    'click .btn-view-entries': function() {
      Session.set('view-entries', !Session.get('view-entries'));
    },

    'click .btn-update': function () {

      if (Session.get('todayEditor-loaded')) {

        // Don't create a (filename, filetype); just get the content
        var newContent = todayEditor.exportFile(null, null);

        if (Entries.findOne( { title: currentDate } )) {
          var newEntryId = Entries.findOne({ title: currentDate});
          Entries.update({_id:newEntryId._id}, {$set: {text: newContent}});
        } else {
          Entries.insert({
            title: currentDate, text: newContent, createdAt: new Date()
          });
        }
      }

      if (Session.get('priorEntryEditor-loaded')) {
        var newContentEditor2 = priorEntryEditor.exportFile(null, null);
        var entryId = Entries.findOne({ title: priorEntryDate});
        Entries.update({_id:entryId._id}, {$set: {text: newContentEditor2}});
      }
    }

  });

  Template.body.helpers({
    todayEntry: function () {
      return dateString;
    }
  });

  Template.viewentries.events({
    'click span': function (event) {

      priorEntryDate = event.target.textContent;
      var entryText = Entries.findOne({title: priorEntryDate}).text;
      var editor2Options = newEditorOptions('epiceditor-view-entries', entryText);
      document.getElementById('epiceditor-view-entries').style.display = 'block';
      priorEntryEditor = new EpicEditor(editor2Options).load();
      Session.set('priorEntryEditor-loaded', true);

      if (Session.get('new-entry')) {
        unloadEditor();
        Session.set('new-entry', false);
      }
    }
  });

  // VIEW ENTRIES TEMPLATE
  Template.viewentries.helpers({
    showEntries: function() {
      return Session.get('view-entries');
    },
    entries: function() {
      //return Entries.find({}, {sort: {createdAt: -1}, limit: 3});
      // @Lyle Add multiple divs, a div limit and "pagination" for
      // the prior entries archive.
      return Entries.find( { title: { $ne: currentDate}}, {sort: {createdAt: -1}});
    }

  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}