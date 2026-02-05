function loadXMLDoc() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      datalist(this);
    }
  };
  xmlhttp.open("GET", "mineralspectra.xml", true);
  xmlhttp.send();
}

function datalist(xml) {
  var x1, x2, x3, x4, x5, i, xmlDoc, txt;
  xmlDoc = xml.responseXML;
  txt = "<select id='sample' size='10' style='width:170px'>";
  x1 = xmlDoc.getElementsByTagName("folder");
  x2 = xmlDoc.getElementsByTagName("mineral");
  x3 = xmlDoc.getElementsByTagName("filetype");
  x4 = xmlDoc.getElementsByTagName("samplename");
  x5 = xmlDoc.getElementsByTagName("temp");

  for (i = 0; i< x2.length; i++) {
    //txt += "<option value=dataset/" + x1[i].childNodes[0].nodeValue + "/" + x4[i].childNodes[0].nodeValue + "." + x3[i].childNodes[0].nodeValue + " onclick=samplespectra()>" "value=dataset/" + x1[i].childNodes[0].nodeValue + "/" + x4[i].childNodes[0].nodeValue + "." + x3[i].childNodes[0].nodeValue + " onclick=samplespectra()" + "</option>";
    txt += "<option value=dataset/" + x1[i].childNodes[0].nodeValue + "/" + x4[i].childNodes[0].nodeValue + "." + x3[i].childNodes[0].nodeValue + " onclick='samplespectra()'>" + x2[i].childNodes[0].nodeValue + " - " + x5[i].childNodes[0].nodeValue + "K" + "</option>";

  }
  txt +="</select>";
  document.getElementById("xmlsamplelist").innerHTML = txt;
}






function search_1() {
  // Declare variables 
  var input, filter, table, tr, td, i;
  input = document.getElementById("myInput_1");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}


function search_2() {
  // Searches for class
  var input, filter, table, tr, td, i;
  input = document.getElementById("myInput_2");

  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[1];
    if (td) {
      if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}

function search_3() {
  // Searches for Temperature
  var T, filterminT, filtermaxT, table, tr, td, i;
  T = +document.getElementById("min_3").value;
  rangeT = +document.getElementById("min_3_range").value;

  if (T==null || T==""){
    filterminT = 0;
    filtermaxT = 600;    
  }
   else {
    filterminT = +T-rangeT;
    filtermaxT = +T+rangeT;
  }

  //filtermin = +min-range;
  //filtermax = +min+range;
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[4];
    if (td) {
      if (td.innerHTML >= filterminT && td.innerHTML <= filtermaxT) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}


function search_4() {
  // Declare variables 
  var CS, filterminCS, filtermaxCS, table, tr, td, i;
  CS = document.getElementById("min_4").value;
  rangeCS = +document.getElementById("min_4_range").value;

  //max = document.getElementById("max_4");
  
  if (CS==null || CS==""){
    filterminCS = 0;
    filtermaxCS = 5;    
  }
   else {
    filterminCS = +CS-rangeCS;
    filtermaxCS = +CS+rangeCS;
  }

  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[5];
    if (td) {
      if (td.innerHTML >= filterminCS && td.innerHTML <= filtermaxCS) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}


/*function search_5() {
  // Declare variables 
  var min, filtermin, max, filtermax, table, tr, td, i;
  //min = parseInt(document.getElementById("min_5").value);
  min = document.getElementById("min_5").value;
  
  //max = document.getElementById("max_5");
  
  filtermin = +min*0.9;
  filtermax = +min*1.1;
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
if (+min<0) {
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[4];
    if (td) {
      if (td.innerHTML < filtermin && td.innerHTML > filtermax) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}

else if(+min>0) {
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[4];
    if (td) {
      if (td.innerHTML > filtermin && td.innerHTML < filtermax) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}


}*/

function search_5() {
  // Declare variables 
  var min, filtermin, max, filtermax, table, tr, td, i;
  //min = parseInt(document.getElementById("min_5").value);
  min = +document.getElementById("min_5").value;
  range = +document.getElementById("min_5_range").value;
  
  //max = document.getElementById("max_5");

  if (min<0){
    range=-1*range
    filtermin = +min+range;
    filtermax = +min-range;  
  }
   else if(min>0){
    filtermin = +min-range;
    filtermax = +min+range;
  }
 
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query

  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[6];
    if (td) {
      if (td.innerHTML >= filtermin && td.innerHTML <= filtermax) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }




}

function search_6() {
  // Declare variables 
  var Bhf, filterminBhf, filtermaxBhf, table, tr, td, i;
  Bhf = document.getElementById("min_6").value;
  rangeBhf = +document.getElementById("min_6_range").value;
  if (Bhf==null || Bhf==""){
    filterminBhf = 0;
    filtermaxBhf = 0;    
  }
   else {
    filterminBhf = +Bhf-rangeBhf;
    filtermaxBhf = +Bhf+rangeBhf;
  }
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[7];
    if (td) {
      if (td.innerHTML >= filterminBhf && td.innerHTML <= filtermaxBhf) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}


function blanksearch() {
  // Declare variables 
  var input, filter, table, tr, td, i;
  input = document.getElementById("myInput_1");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      tr[i].style.display = "";

      document.getElementById("myInput_1").value = "";
      document.getElementById("myInput_2").value = "";
      document.getElementById("min_3").value = "";
      document.getElementById("min_4").value = 0.0;
      document.getElementById("min_5").value = 0.0;
      document.getElementById("min_6").value = 0.0;
      //form.myInput_1 = "0"
      //form.min_4.value = "0"
    } 
  }
}



function bigsearch() {
  // Declare variables 
  
  var table, tr, td, i;
  
  var checkBoxS = document.getElementById("tickS");
  var checkBoxE = document.getElementById("tickE");
  var checkBoxB = document.getElementById("tickB");
  var checkBoxP = document.getElementById("tickP");
  var checkBoxU = document.getElementById("tickU");
  var checkBoxA = document.getElementById("tickA");

  var T, rangeT, filterminT, filtermaxT, td2;
  T = document.getElementById("min_3").value;
  rangeT = +document.getElementById("min_3_range").value;

  if (T==null || T==""){
    filterminT = 0;
    filtermaxT = 600;    
  }
   else {
    filterminT = +T-rangeT;
    filtermaxT = +T+rangeT;
  }


  var CS, rangeCS, filterminCS, filtermaxCS, td3;
  CS = document.getElementById("min_4").value;
  rangeCS = +document.getElementById("min_4_range").value;
  if (CS==null || CS==""){
    filterminCS = 0;
    filtermaxCS = 5;    
  }
   else {
    filterminCS = +CS-rangeCS;
    filtermaxCS = +CS+rangeCS;
  }


  var QS, rangeQS, filterminQS, filtermaxQS, td4;
  QS = +document.getElementById("min_5").value;
  rangeQS = +document.getElementById("min_5_range").value;
  filterminQS = +QS-rangeQS;
  filtermaxQS = +QS+rangeQS;
  
  if (QS<0){
    //range=-1*range
    filterminQS = +QS-rangeQS;
    filtermaxQS = +QS+rangeQS;
  }
   else if(QS>0){
    filterminQS = +QS-rangeQS;
    filtermaxQS = +QS+rangeQS;
  }



  var Bhf, rangeBhf, filterminBhf, filtermaxBhf, td5;
  Bhf = document.getElementById("min_6").value;
  rangeBhf = +document.getElementById("min_6_range").value;
  if (Bhf==null || Bhf==""){
    filterminBhf = 0;
    filtermaxBhf = 0;    
  }
   else {
    filterminBhf = +Bhf-rangeBhf;
    filtermaxBhf = +Bhf+rangeBhf;
  }


  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td1 = tr[i].getElementsByTagName("td")[2];  //type
    td2 = tr[i].getElementsByTagName("td")[4];  //Temp
    td3 = tr[i].getElementsByTagName("td")[5];  //CS
    td4 = tr[i].getElementsByTagName("td")[6];  //QS
    td5 = tr[i].getElementsByTagName("td")[7];  //Bhf

    if (checkBoxS.checked == true) {
    if (td1 && td2 && td3 && td5) {
      if (td1.innerHTML == "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML !== "P"
        && td1.innerHTML !== "U"
        && td2.innerHTML >= filterminT 
        && td2.innerHTML <= filtermaxT
        && td3.innerHTML >= filterminCS 
        && td3.innerHTML <= filtermaxCS
        && td4.innerHTML >= filterminQS 
        && td4.innerHTML <= filtermaxQS
        && td5.innerHTML >= filterminBhf 
        && td5.innerHTML <= filtermaxBhf
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }


    if (checkBoxE.checked == true) {
    if (td1 && td2 && td3 && td5) {
      if (td1.innerHTML !== "S"
        && td1.innerHTML == "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML !== "P"
        && td1.innerHTML !== "U"
        && td2.innerHTML >= filterminT 
        && td2.innerHTML <= filtermaxT
        && td3.innerHTML >= filterminCS 
        && td3.innerHTML <= filtermaxCS
        && td4.innerHTML >= filterminQS 
        && td4.innerHTML <= filtermaxQS
        && td5.innerHTML >= filterminBhf 
        && td5.innerHTML <= filtermaxBhf
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }

    if (checkBoxB.checked == true) {
    if (td1 && td2 && td3 && td5) {
      if (td1.innerHTML !== "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML == "B"
        && td1.innerHTML !== "P"
        && td1.innerHTML !== "U"
        && td2.innerHTML >= filterminT 
        && td2.innerHTML <= filtermaxT
        && td3.innerHTML >= filterminCS 
        && td3.innerHTML <= filtermaxCS
        && td4.innerHTML >= filterminQS 
        && td4.innerHTML <= filtermaxQS
        && td5.innerHTML >= filterminBhf 
        && td5.innerHTML <= filtermaxBhf
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }

    if (checkBoxP.checked == true) {
    if (td1 && td2 && td3 && td5) {
      if (td1.innerHTML !== "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML == "P"
        && td1.innerHTML !== "U"
        && td2.innerHTML >= filterminT 
        && td2.innerHTML <= filtermaxT
        && td3.innerHTML >= filterminCS 
        && td3.innerHTML <= filtermaxCS
        && td4.innerHTML >= filterminQS 
        && td4.innerHTML <= filtermaxQS
        && td5.innerHTML >= filterminBhf 
        && td5.innerHTML <= filtermaxBhf
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }


    if (checkBoxU.checked == true) {
    if (td1 && td2 && td3 && td5) {
      if (td1.innerHTML !== "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML !== "P"
        && td1.innerHTML == "U"
        && td2.innerHTML >= filterminT 
        && td2.innerHTML <= filtermaxT
        && td3.innerHTML >= filterminCS 
        && td3.innerHTML <= filtermaxCS
        && td4.innerHTML >= filterminQS 
        && td4.innerHTML <= filtermaxQS
        && td5.innerHTML >= filterminBhf 
        && td5.innerHTML <= filtermaxBhf
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }

    if (checkBoxA.checked == true) {
     if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        || td1.innerHTML == "E"
        || td1.innerHTML == "B"
        || td1.innerHTML == "P"
        || td1.innerHTML == "U")
        && td2.innerHTML >= filterminT 
        && td2.innerHTML <= filtermaxT
        && td3.innerHTML >= filterminCS 
        && td3.innerHTML <= filtermaxCS
        && td4.innerHTML >= filterminQS 
        && td4.innerHTML <= filtermaxQS
        && td5.innerHTML >= filterminBhf 
        && td5.innerHTML <= filtermaxBhf
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }

  }



}


function bigsearch2() {
  // Declare variables 
  
  var table, tr, td, i;
  
  var min4, filtermin4, filtermax4; 
  min4 = document.getElementById("min_4"); //IS
 
  filtermin4 = min4.value*0.5;
  filtermax4 = min4.value*1.5;

  /*var min5, filtermin5, filtermax5, td5; 
  min5 = document.getElementById("min_5"); //QS
  
  filtermin5 = min5.value*0.5;
  filtermax5 = min5.value*1.5;*/


  var min7, filtermin7, filtermax7, td7; 
  min7 = document.getElementById("min_7"); //Bhf

  filtermin7 = min7.value*0.95;
  filtermax7 = min7.value*1.05;

  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[3];
    //td5 = tr[i].getElementsByTagName("td")[4];
    td7 = tr[i].getElementsByTagName("td")[6];
    if (td && td7) {
      if (td.innerHTML > filtermin4 && td.innerHTML < filtermax4 && td7.innerHTML > filtermin7 && td7.innerHTML < filtermax7) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}
