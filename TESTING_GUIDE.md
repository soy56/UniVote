# Testing Guide for Phase 1 Features

## ✅ Pre-Testing Checklist

- [x] Backend server running on port 4000
- [ ] Frontend server running on port 3000
- [ ] Admin user created (or use existing admin account)

## 🧪 Test Scenarios

### Test 1: QR Code Vote Receipt

**Steps:**
1. Sign up as a new voter (or sign in as existing voter)
2. Wait for election to be in "Voting" phase (admin needs to start voting)
3. Cast a vote for any candidate
4. Check browser console for receipt object:
   ```javascript
   {
     voteId: "...",
     candidateId: "...",
     candidateName: "...",
     timestamp: 1234567890,
     verificationCode: "ABC123DEF456GHIJ",
     qrCode: "data:image/png;base64,..."
   }
   ```

**Expected Result:**
- Vote succeeds with success message
- Receipt data is logged in console
- QR code is a valid Data URL

**Manual API Test:**
```powershell
# Cast a vote and capture the response
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
    "Content-Type" = "application/json"
}

$body = @{
    candidateId = "CANDIDATE_ID_HERE"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/votes" -Method Post -Headers $headers -Body $body
$response.receipt
```

---

### Test 2: Receipt Verification

**Steps:**
1. Get a receipt from Test 1
2. Use the verification endpoint to validate it

**API Test:**
```powershell
$body = @{
    voteId = "VOTE_ID_FROM_RECEIPT"
    verificationCode = "VERIFICATION_CODE_FROM_RECEIPT"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/verify-receipt" -Method Post -Headers @{"Content-Type"="application/json"} -Body $body
$response
```

**Expected Result:**
```javascript
{
  valid: true,
  vote: {
    candidateName: "Candidate Name",
    timestamp: 1234567890
  }
}
```

---

### Test 3: PDF Export (Admin Only)

**Prerequisites:** Be signed in as admin

**Steps:**
1. Ensure some votes have been cast
2. Make API request to export endpoint

**API Test:**
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ADMIN_TOKEN_HERE"
}

Invoke-WebRequest -Uri "http://localhost:4000/export/pdf" -Headers $headers -OutFile "election-results.pdf"
```

**Expected Result:**
- PDF file downloads successfully
- Open PDF and verify:
  - ✅ Election title and description
  - ✅ Vote counts and percentages
  - ✅ Candidate rankings
  - ✅ Professional formatting

---

### Test 4: CSV Export (Admin Only)

**API Test:**
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ADMIN_TOKEN_HERE"
}

Invoke-WebRequest -Uri "http://localhost:4000/export/csv" -Headers $headers -OutFile "results.csv"
```

**Expected Result:**
- CSV file downloads
- Open in Excel/Google Sheets
- Verify columns: Rank, Candidate Name, Tagline, Vote Count, Percentage

**Test Vote Records CSV:**
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/export/votes-csv" -Headers $headers -OutFile "votes.csv"
```

---

### Test 5: Component Rendering

**VoteReceipt Component:**
1. Open: `frontend/src/components/VoteReceipt.js`
2. Create a test file to render it:

```javascript
// Test in browser console after integrating
const testReceipt = {
  voteId: "test-123",
  candidateId: "cand-456",
  candidateName: "Test Candidate",
  timestamp: Date.now(),
  verificationCode: "ABC123DEF456GHIJ",
  qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
};
```

**ExportButtons Component:**
- Should render three buttons
- PDF button (red gradient)
- CSV button (green gradient)  
- Vote Records button (outlined)

**SocialShare Component:**
- Four share buttons: Twitter, Facebook, WhatsApp, LinkedIn
- Each with branded icon and label

---

## 🔍 Quick Verification Checklist

### Backend Verification
- [ ] Server starts without errors
- [ ] `/export/pdf` endpoint returns PDF blob
- [ ] `/export/csv` endpoint returns CSV file
- [ ] `/export/votes-csv` endpoint returns detailed CSV
- [ ] `/verify-receipt` validates correct codes
- [ ] QR code is included in vote response

### Frontend Verification
- [ ] VoteReceipt.js has no syntax errors
- [ ] ExportButtons.js has no syntax errors
- [ ] SocialShare.js has no syntax errors
- [ ] All Material-UI imports are correct
- [ ] react-share library is installed

---

## 🐛 Troubleshooting

**Issue: "Module not found: qrcode"**
- Solution: `cd backend && npm install qrcode`

**Issue: "Module not found: react-share"**
- Solution: `cd frontend && npm install react-share`

**Issue: PDF export fails**
- Check: Admin authentication token is valid
- Check: PDFKit is installed
- Check: Election has candidates and votes

**Issue: QR code doesn't display**
- Check: Data URL format is correct
- Check: `qrCode` field exists in receipt object
- Verify: QRCode.toDataURL() returns valid string

---

## 📊 Success Criteria

✅ All API endpoints return expected data  
✅ PDF export generates formatted report  
✅ CSV exports contain correct data  
✅ QR codes are generated and valid  
✅ Receipt verification works correctly  
✅ All components render without errors  

---

## 🔄 Next Steps After Testing

Once testing is complete and all features work:

1. **Integrate components into App.js**
2. **Add export buttons to AdminPanel.js**
3. **Implement dark/light mode toggle**
4. **Enhance countdown timer visuals**

Then proceed to **Phase 2: Analytics Dashboard**!
