
function bigsearch() {
  // Declare variables 
  
  var table, tr, td, i;
  
  var min4, filtermin4, max4, filtermax4; 
  min4 = document.getElementById("min_4"); //IS censhift
  max4 = document.getElementById("max_4"); 
  filtermin4 = min4.value;
  filtermax4 = max4.value;

  var min5, filtermin5, max5, filtermax5, td5; 
  min5 = document.getElementById("min_5"); //QS qshift
  max5 = document.getElementById("max_5");
  filtermin5 = min5.value;
  filtermax5 = max5.value;

  var min7, filtermin7, max7, filtermax7, td7; 
  min7 = document.getElementById("min_7"); // hyperfinefield
  max7 = document.getElementById("max_7");
  filtermin7 = min7.value;
  filtermax7 = max7.value;

  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[3];
    td5 = tr[i].getElementsByTagName("td")[4];
    td7 = tr[i].getElementsByTagName("td")[6];
    if (td && td5 && td7) {
      if (td.innerHTML > filtermin4 && td.innerHTML < filtermax4 && td5.innerHTML > filtermin5 && td5.innerHTML < filtermax5 && td7.innerHTML > filtermin7 && td7.innerHTML < filtermax7) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    } 
  }
}
