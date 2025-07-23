// 1. Initialize Quill
const quill = new quill('#editor', {
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
const CLIENT_ID = "923732194950-47pgmq5t0su9tcimna5v3hbcomtsdta2.apps.googleusercontent.com";

function handleCredentialResponse(response) {
  console.log("Encoded JWT ID token: " + response.credential);
  // From here, you can send this token to your backend or use it with Google APIs

  const data = parseJwt(response.credential);
  console.log("User info:", data);
}

// Helper to decode the JWT
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));

  return JSON.parse(jsonPayload);
}
function start() {
  gapi.load('client:auth2', initClient);
}
const clientId = '923732194950-47pgmq5t0su9tcimna5v3hbcomtsdta2.apps.googleusercontent.com';
const apiKey = 'AIzaSyAo-uVNAxL5yfmARO6XzejgW01bZfuQ91E'; // Not required for this app
const DISCOVERY_DOCS = ["https://docs.googleapis.com/$discovery/rest?version=v1"];
const scope = 'https://www.googleapis.com/auth/documents';

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
