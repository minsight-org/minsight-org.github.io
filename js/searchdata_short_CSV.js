
//Open Data in the form of a CSV file
//Based on code from: https://www.webslesson.info/2017/04/csv-file-to-html-table-using-ajax-jquery.html
$(document).ready(function(){
 $('#load_data').ready(function(){
  $.ajax({
   //url:"dataset/MBData_short.csv",
   url:"dataset/MBData_verified.txt",
   dataType:"text",
   success:function(data)
   {
    var employee_data = data.split(/\r?\n|\r/);
    var table_data = '<table id="myTable" class="datatable">';
    for(var count = 0; count<employee_data.length; count++)
    {
     var cell_data = employee_data[count].split("\t");
     table_data += '<tr>';
     for(var cell_count=0; cell_count<cell_data.length; cell_count++)
     {
      if(count === 0)
      {
       table_data += '<th>'+cell_data[cell_count]+'</th>';
      }
      else
      {
       table_data += '<td>'+cell_data[cell_count]+'</td>';
      }
     }
     table_data += '</tr>';
    }
    table_data += '</table>';
    $('#MBData_table').html(table_data);
   }
  });
 });
 
});

// END CSV Load


//Search by mineral name
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

//Search by mineral class
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

//Clear all boxes and search variables
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


function sortTable(n) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = document.getElementById("myTable");
  switching = true;
  //Set the sorting direction to ascending:
  dir = "asc"; 
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      /*check if the two rows should switch place,
      based on the direction, asc or desc:*/
      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      //Each time a switch is done, increase this count by 1:
      switchcount ++;      
    } else {
      /*If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again.*/
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}


//Search all parameters in the main database table
function bigsearch() {
  // Declare variables 
  
  var table, tr, td, i;
  
  var checkBoxS = document.getElementById("tickS");
  var checkBoxE = document.getElementById("tickE");
  var checkBoxB = document.getElementById("tickB");
  //var checkBoxP = document.getElementById("tickP");
  var checkBoxU = document.getElementById("tickU");
  //var checkBoxA = document.getElementById("tickA");

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
    //td1 = tr[i].getElementsByTagName("td")[2];  //type
    //td2 = tr[i].getElementsByTagName("td")[4];  //Temp
    //td3 = tr[i].getElementsByTagName("td")[5];  //CS
    //td4 = tr[i].getElementsByTagName("td")[6];  //QS
    //td5 = tr[i].getElementsByTagName("td")[7];  //Bhf
    td1 = tr[i].getElementsByTagName("td")[2];  //type
    td2 = tr[i].getElementsByTagName("td")[4];  //Temp
    td3 = tr[i].getElementsByTagName("td")[5];  //CS
    td4 = tr[i].getElementsByTagName("td")[7];  //QS
    td5 = tr[i].getElementsByTagName("td")[9];  //Bhf
    if ((checkBoxS.checked == true 
      && checkBoxE.checked == false
      && checkBoxB.checked == false
      && checkBoxU.checked == false)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML !== "U")
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

    else if ((checkBoxS.checked == false 
      && checkBoxE.checked == true
      && checkBoxB.checked == false
      && checkBoxU.checked == false)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML !== "S"
        && td1.innerHTML == "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML !== "U")
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


    else if ((checkBoxS.checked == false 
      && checkBoxE.checked == false
      && checkBoxB.checked == true
      && checkBoxU.checked == false)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML !== "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML == "B"
        && td1.innerHTML !== "U")
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

        else if ((checkBoxS.checked == false 
      && checkBoxE.checked == false
      && checkBoxB.checked == false
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML !== "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML == "U")
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

    //Multiple checkboxes (2)
    else if ((checkBoxS.checked == true 
      && checkBoxE.checked == true
      && checkBoxB.checked == false
      && checkBoxU.checked == false)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        || td1.innerHTML == "E"
        && td1.innerHTML !== "B"
        && td1.innerHTML !== "U")
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

    else if ((checkBoxS.checked == true 
      && checkBoxE.checked == false
      && checkBoxB.checked == true
      && checkBoxU.checked == false)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        && td1.innerHTML !== "E"
        || td1.innerHTML == "B"
        && td1.innerHTML !== "U")
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

    else if ((checkBoxS.checked == true 
      && checkBoxE.checked == false
      && checkBoxB.checked == false
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML !== "B"
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


    else if ((checkBoxS.checked == false 
      && checkBoxE.checked == true
      && checkBoxB.checked == true
      && checkBoxU.checked == false)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML !== "S"
        && td1.innerHTML == "E"
        || td1.innerHTML == "B"
        && td1.innerHTML !== "U")
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

    else if ((checkBoxS.checked == false 
      && checkBoxE.checked == true
      && checkBoxB.checked == false
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML !== "S"
        && td1.innerHTML == "E"
        && td1.innerHTML !== "B"
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

    else if ((checkBoxS.checked == false 
      && checkBoxE.checked == false
      && checkBoxB.checked == true
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML !== "S"
        && td1.innerHTML !== "E"
        && td1.innerHTML == "B"
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

    //Multiple checkboxes (3)
    else if ((checkBoxS.checked == true 
      && checkBoxE.checked == true
      && checkBoxB.checked == true
      && checkBoxU.checked == false)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        || td1.innerHTML == "E"
        || td1.innerHTML == "B"
        && td1.innerHTML !== "U")
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


    else if ((checkBoxS.checked == true 
      && checkBoxE.checked == true
      && checkBoxB.checked == false
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        || td1.innerHTML == "E"
        || td1.innerHTML !== "B"
        && td1.innerHTML == "U")
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

    else if ((checkBoxS.checked == true 
      && checkBoxE.checked == false
      && checkBoxB.checked == true
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        && td1.innerHTML !== "E"
        || td1.innerHTML == "B"
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

    else if ((checkBoxS.checked == false 
      && checkBoxE.checked == true
      && checkBoxB.checked == true
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML !== "S"
        && td1.innerHTML == "E"
        || td1.innerHTML == "B"
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


    else if ((checkBoxS.checked == true 
      && checkBoxE.checked == true
      && checkBoxB.checked == true
      && checkBoxU.checked == true)
      ) {
    if (td1 && td2 && td3 && td5) {
      if ((td1.innerHTML == "S"
        || td1.innerHTML == "E"
        || td1.innerHTML == "B"
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

