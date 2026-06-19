Business rules:

The end goal of this product is to show the business done i.e. Leads. in a analytics dashboard. 

So in a heiarchal way The guy besids them will be shown. 

Here the heiarchy factor is not defined, 1 guy can be a Hational head for some Posp if there are not more people it will act as Zonal Manager

for e.g. 

{
      "DistrictId": "43",
      "DistrictName": "SIVAGANGA",
      "DistrictManagerId": "269175",
      "DistrictManagerCode": "DESIKAMANI.ASMTN",
      "DistrictManagerName": "DESIKAMANI ASM TN",
      "usertype": "12",
      "R1_UserId": "57682",
      "R1_UserCode": "BHOOPATHI.RHTN",
      "R1_UserName": "BOOPATHI MANOKARAN",
      "R1_usertype": "6",
      "R2_UserId": "609460",
      "R2_UserCode": "RAVI.BABUSZH",
      "R2_UserName": "Ravi Babu Ummadisetty",
      "R2_usertype": "14",
      "R3_UserId": "592240",
      "R3_UserCode": "HARI.DUTT",
      "R3_UserName": "Hari Dutt",
      "R3_usertype": "0",
      "R4_UserId": "79",
      "R4_UserCode": "VIVEK",
      "R4_UserName": "VIVEK GUPTA",
      "R4_usertype": "0",
      "R5_UserId": "",
      "R5_UserCode": "",
      "R5_UserName": "",
      "R5_usertype": "",
      "R6_UserId": "",
      "R6_UserCode": "",
      "R6_UserName": "",
      "R6_usertype": "",
      "R7_UserId": "",
      "R7_UserCode": "",
      "R7_UserName": "",
      "R7_usertype": ""
    },

see but here 
 {
      "DistrictId": "17",
      "DistrictName": "PRAKASAM",
      "DistrictManagerId": "538541",
      "DistrictManagerCode": "SANDRAPATI.ASMAP",
      "DistrictManagerName": "SANDRAPATI IMMANIYELU ASM AP",
      "usertype": "11",
      "R1_UserId": "266581",
      "R1_UserCode": "GANESH.ASMAP",
      "R1_UserName": "GANESH ASM AP",
      "R1_usertype": "4",
      "R2_UserId": "73267",
      "R2_UserCode": "NURULLA.ASMAP",
      "R2_UserName": "NURULLA SYED ASM AP DIRECT",
      "R2_usertype": "6",
      "R3_UserId": "609460",
      "R3_UserCode": "RAVI.BABUSZH",
      "R3_UserName": "Ravi Babu Ummadisetty",
      "R3_usertype": "14",
      "R4_UserId": "592240",
      "R4_UserCode": "HARI.DUTT",
      "R4_UserName": "Hari Dutt",
      "R4_usertype": "0",
      "R5_UserId": "79",
      "R5_UserCode": "VIVEK",
      "R5_UserName": "VIVEK GUPTA",
      "R5_usertype": "0",
      "R6_UserId": "",
      "R6_UserCode": "",
      "R6_UserName": "",
      "R6_usertype": "",
      "R7_UserId": "",
      "R7_UserCode": "",
      "R7_UserName": "",
      "R7_usertype": ""
    },


the person with usercode HARI.DUTT is top second guy as a National Head.

So there is no fixed heiarchy. for a specific Usercode.

so we have to design the architecture of our code like that like a MLM marketing. Where we will make a graph of Org chart. 
we have to map from our apis we have and  make a cron jobs to handle the org heiarchy from our side , weekly. 

we have the user data when we login , we get the usercode or UserId from that we have to map to list-posp-data.json

{
    "UserId":  "12606",
    "UserCode":  "CSP006591",
    "MobileNo":  "9009660096",
    "EmailId":  "rkhandwa@gmail.com",
    "districtid":  "675",
    "stateid":  "25",
    "cityid":  "2113",
    "HephGcdCode":  "GIDROINET2000014",
    "CreatedDate":  "26-08-2025 12:36:41",
    "CreatedBy":  "CSP006591"
}

from this we have to map out what user role he is as well where he lies in the heiarchy. 
this to be handled from our side. 

so the main key is districtid and usercode we have to play with.


ASM or District Manager : we have to check what districtid hes under in. from the heiarchy data. and make an array of districtid under him and than check the posps working in that district and than will represent the business under him and all parameters required under him. 

same we have to do the above heiarchy above asm, 


 {
      "DistrictId": "17",
      "DistrictName": "PRAKASAM",
      "DistrictManagerId": "538541",
      "DistrictManagerCode": "SANDRAPATI.ASMAP",
      "DistrictManagerName": "SANDRAPATI IMMANIYELU ASM AP",
      "usertype": "11",
      "R1_UserId": "266581",
      "R1_UserCode": "GANESH.ASMAP",
      "R1_UserName": "GANESH ASM AP",
      "R1_usertype": "4",
      "R2_UserId": "73267",
      "R2_UserCode": "NURULLA.ASMAP",
      "R2_UserName": "NURULLA SYED ASM AP DIRECT",
      "R2_usertype": "6",
      "R3_UserId": "609460",
      "R3_UserCode": "RAVI.BABUSZH",
      "R3_UserName": "Ravi Babu Ummadisetty",
      "R3_usertype": "14",
      "R4_UserId": "592240",
      "R4_UserCode": "HARI.DUTT",
      "R4_UserName": "Hari Dutt",
      "R4_usertype": "0",
      "R5_UserId": "79",
      "R5_UserCode": "VIVEK",
      "R5_UserName": "VIVEK GUPTA",
      "R5_usertype": "0",
      "R6_UserId": "",
      "R6_UserCode": "",
      "R6_UserName": "",
      "R6_usertype": "",
      "R7_UserId": "",
      "R7_UserCode": "",
      "R7_UserName": "",
      "R7_usertype": ""
    },

here asm/district manager is SUMIT.KUMAR ASMJHD

So now we have the heiarchy and the userroles in user-type.txt and have to map with usertype, and have to map with the heiarchy data that we will get from the api uatserviceapi.roinet.in/Cognitensor/ListHierarchyUserData
for example , "R5_UserCode": "VIVEK",
      "R5_UserName": "VIVEK GUPTA",
      "R5_usertype": "0",

      her usertype of usercode VIVEK GUPTA is "0", so by checking the usertype from user-type.txt it is  ADMIN = 0 

but these are just mere roles the final thing we have to do the mapping of the all oranisations.
So from now on , take every one who is working in a business , and what business under them we have to show it in our app. 

the real business are done by POSP -> ASM, than we have to map out everything.

for example, how many ASM/District Manager under PRABHAT.RHJKND, than we have to map how many districtid under those ASM/District Manager and than to those specific Districtid how many posps working and having leads. 

So from our backend only we have to make a graphical representation of that organization, so that we can fetch all the personas and business data in milliseconds. and representation will be shown in org chart.


NOTE: 
1. we dont have posps in the hierarchy , we have to map according to the districtid.
2. we have to show business dashboard zonal wise, statewise, and district wise in some filters. so than we will map with list-city.json, list-district.json, lis-state.json. 









