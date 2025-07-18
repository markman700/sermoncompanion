// 1. Initialize Quill
const quill = new Quill('#editor', {
  theme: 'snow',
  placeholder: 'Start writing your sermon...',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  }
});

// 2. Load Google API
function start() {
  gapi.load('client:auth2', initClient);
}
const CLIENT_ID = '923732194950-47pgmq5t0su9tcimna5v3hbcomtsdta2.apps.googleusercontent.com';
const API_KEY = ''; // Not required for this app
const DISCOVERY_DOCS = ["https://docs.googleapis.com/$discovery/rest?version=v1"];
const SCOPES = 'https://www.googleapis.com/auth/documents';

let accessToken = '';
let docId = '';

function initClient() {
  gapi.client.init({
    apiKey,
    clientId,
    scope
  }).then(() => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signIn().then(googleUser => {
      accessToken = googleUser.getAuthResponse().access_token;
      createGoogleDoc();
    });
  });
}

// 3. Create a new Google Doc
function createGoogleDoc() {
  fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'New Sermon - ' + new Date().toLocaleDateString()
    })
  })
  .then(res => res.json())
  .then(data => {
    docId = data.documentId;
    console.log('Created Doc:', docId);
    autoSaveToGoogleDoc();
  });
}

// 4. Auto-save content every 10 seconds
function autoSaveToGoogleDoc() {
  setInterval(() => {
    const content = quill.root.innerHTML;

    // Replace entire document with new content
    fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex: 999999
              }
            }
          },
          {
            insertText: {
              text: content.replace(/<[^>]+>/g, ''), // Removes HTML tags for Google Docs
              location: { index: 1 }
            }
          }
        ]
      })
    })
    .then(res => res.json())
    .then(data => console.log('Auto-saved to Google Doc'))
    .catch(err => console.error('Save failed', err));
  }, 10000);
}

// Start Google Sign-In flow
start();
