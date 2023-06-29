
exports.payload = {"firstName":"test","lastName":"test","company":"test","country":"India","postalCode":"131027","phone":"99999999","email":"test@test.com","Preferred_Demo_Days__c":"Monday, Tuesday, Wednesday, Thursday, Friday","Preferred_Demo_Times__c":"Morning, Afternoon, Evening","Pardot_Form_Message__c":"fsa","Products__c":"HydroMARK, Magseed","Solutions__c":"Core Specimen Imaging, Lesion Localization","Email_Opt_In__c":"Yes","Phone_Opt_In__c":"No","Text_Opt_In__c":"Yes"};
exports.init = {
 headers: {
    'Content-Type': 'application/json',
  },
  method: 'POST',
  body: JSON.stringify({data : ""})
}

exports.verifyResponse = async (resp, msg, code) => {
  expect(resp).not.toBeNull();
  expect(await resp.text()).toMatch(msg);
  expect(resp.status).toEqual(code);
}