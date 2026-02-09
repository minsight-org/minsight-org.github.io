
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
  // Searches for Oxidation state --> not currently available
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
  // Searches for Temperature --> currently does not work. It does not like having a 0 in the search bar
  var min, filtermin, max, filtermax, table, tr, td, i;
  min = document.getElementById("min_3");
  max = document.getElementById("max_3");
  
  filtermin = min.value;
  filtermax = max.value;
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[2];
    if (td) {
      if (td.innerHTML > filtermin && td.innerHTML < filtermax) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}


function search_4() {
  // Declare variables 
  var min, filtermin, max, filtermax, table, tr, td, i;
  min = document.getElementById("min_4");
  max = document.getElementById("max_4");
  
  filtermin = min.value;
  filtermax = max.value;
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[3];
    if (td) {
      if (td.innerHTML > filtermin && td.innerHTML < filtermax) {
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
      if (td.innerHTML.toUpperCase().indexOf(filter) > 0) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}

function search_5() {
  // Declare variables 
  var min, filtermin, max, filtermax, table, tr, td, i;
  min = document.getElementById("min_5");
  max = document.getElementById("max_5");
  
  filtermin = min.value;
  filtermax = max.value;
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
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


function search_6() {
  // Declare variables 
  var min, filtermin, max, filtermax, table, tr, td, i;
  min = document.getElementById("min_6");
  max = document.getElementById("max_6");
  
  filtermin = min.value;
  filtermax = max.value;
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[5];
    if (td) {
      if (td.innerHTML > filtermin && td.innerHTML < filtermax) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}

function search_7() {
  // Declare variables for hyperfine field
  var min, filtermin, max, filtermax, table, tr, td, i;
  min = document.getElementById("min_7");
  max = document.getElementById("max_7");
  
  filtermin = min.value;
  filtermax = max.value;
  
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[6];
    if (td) {
      if (td.innerHTML > filtermin && td.innerHTML < filtermax) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}

function search_8() {
  // Declare variables 
  var input, filter, table, tr, td, i;
  input = document.getElementById("myInput_8");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[7];
    if (td) {
      if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}

function bigsearch() {
  // Declare variables 
  
  var table, tr, td, i;
  
  var min4, filtermin4, max4, filtermax4; 
  min4 = document.getElementById("min_4"); //IS
  max4 = document.getElementById("max_4"); 
  filtermin4 = min4.value;
  filtermax4 = max4.value;

  var min5, filtermin5, max5, filtermax5, td5; 
  min5 = document.getElementById("min_5"); //QS
  max5 = document.getElementById("max_5");
  filtermin5 = min5.value;
  filtermax5 = max5.value;

  var min6, filtermin6, max6, filtermax6, td6; 
  min6 = document.getElementById("min_6"); //Q-shift
  max6 = document.getElementById("max_6");
  filtermin6 = min6.value;
  filtermax6 = max6.value;

  var min7, filtermin7, max7, filtermax7, td7; 
  min7 = document.getElementById("min_7"); //Bhf
  max7 = document.getElementById("max_7");
  filtermin7 = min7.value;
  filtermax7 = max7.value;

  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[3];
    td5 = tr[i].getElementsByTagName("td")[4];
    td6 = tr[i].getElementsByTagName("td")[5];
    td7 = tr[i].getElementsByTagName("td")[6];
    if (td && td5 && td7) {
      if (
        (td.innerHTML >= filtermin4 
        && td.innerHTML <= filtermax4
        && td5.innerHTML >= filtermin5 
        && td5.innerHTML <= filtermax5  
        && td7.innerHTML >= filtermin7 
        && td7.innerHTML <= filtermax7) 
        ) {
      
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
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
