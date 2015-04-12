// Because this uses local storage temporarily, any changes made on one browser
// will not immediately be updated on another browser, though the database
// has been updated. If using more than one browser, be sure to clear local content

// @lyle there is probably a better way of dealing with that

var Entries = new Mongo.Collection('entries');

if (Meteor.isClient) {

  var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
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
  var dateStringFileName = year + monthFileName + dayFileName;

  var editor;
  var currentJournalEntryDate;
  var editor2;
  var todayDefaultContent;

  function unloadEditor() {
    if (Session.get('editor-loaded')) {
      editor.unload();
      document.getElementById('epiceditor').style.display = 'none';
      Session.set('editor-loaded', false);
    }
  }

  function unloadViewEntryEditor() {
    if (Session.get('editor2-loaded')) {
      editor2.unload();
      document.getElementById('epiceditor-view-entries').style.display = 'none';
      Session.set('editor2-loaded', false);
    }
  }

  // BODY TEMPLATE
  Template.body.events({
    'click .btn-update': function () {

      if (Session.get('editor-loaded')) {
        var newContent = editor.exportFile(null, null);
        // (null filename, null type))
        if (Entries.findOne( { title: dateStringFileName } )) {
          var newEntryId = Entries.findOne({ title: dateStringFileName});
          Entries.update({_id:newEntryId._id}, {$set: {text: newContent}});
          //console.log('updating ' + dateStringFileName);
        } else {
          Entries.insert({
            title: dateStringFileName, text: newContent, createdAt: new Date()
          });
            //console.log('inserting ' + dateStringFileName);
        }
      }

      if (Session.get('editor2-loaded')) {
        var newContentEditor2 = editor2.exportFile(null, null);
        var entryId = Entries.findOne({ title: currentJournalEntryDate});
        Entries.update({_id:entryId._id}, {$set: {text: newContentEditor2}});
      }
    },

    'click .btn-view-entries': function() {
      Session.set('view-entries', !Session.get('view-entries'));
    },

    'click .btn-today-entry': function() {
      Session.set('new-entry', !Session.get('new-entry'));

      if (Session.get('editor2-loaded')) {
        unloadViewEntryEditor();
        Session.set('view-entries', false);
      }

      // Set default content for today's journal entry
      todayDefaultContent = Entries.findOne({title: dateStringFileName}).text || '##' + dateString;
      //console.log(todayDefaultContent);

      if (Session.get('new-entry')) {
        var opts = {  // Set up options for editor load args
          container: 'epiceditor',
          textarea: null,
          basePath: '/epiceditor',
          clientSideStorage: true,
          localStorageName: dateStringFileName,
          useNativeFullscreen: true,
          parser: marked,
          file: {
            name: dateStringFileName,
            defaultContent: todayDefaultContent,
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

        // Display the editor div and load the editor using options set above
        document.getElementById('epiceditor').style.display = 'block';
        editor = new EpicEditor(opts).load();
        Session.set('editor-loaded', true);

      } else {
        unloadEditor();
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

      currentJournalEntryDate = event.target.textContent;
      var entryText = Entries.findOne({title: currentJournalEntryDate}).text;

      var opts2 = {
        container: 'epiceditor-view-entries',
        textarea: null,
        basePath: '/epiceditor',
        clientSideStorage: false,
        localStorageName: currentJournalEntryDate,
        useNativeFullscreen: true,
        parser: marked,
        file: {
          name: null,
          defaultContent: entryText,
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

      document.getElementById('epiceditor-view-entries').style.display = 'block';
      editor2 = new EpicEditor(opts2).load();
      Session.set('editor2-loaded', true);

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
      return Entries.find( { title: { $ne: dateStringFileName}}, {sort: {createdAt: -1}});
      //return Entries.find( { }, {sort: {createdAt: -1}});

    }

  });
}

Meteor.methods({

});

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}