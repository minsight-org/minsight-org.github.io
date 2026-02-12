
//Open Data in the form of a CSV file
//Based on code from: https://www.webslesson.info/2017/04/csv-file-to-html-table-using-ajax-jquery.html
$(document).ready(function(){
 $('#load_data').ready(function(){
  $.ajax({
   //url:"dataset/parameters.txt",
   url:"database/parameters/MBData_verified.txt",
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



// $(document).ready(function () {
//    $('#load_data').ready(function(){

//     $.ajax({
//         url: "dataset/parameters.txt",
//         dataType: "text",
//         success: function (data) {

//             const rows = data.split(/\r?\n/).filter(r => r.trim() !== "");
//             let table = '<table id="myTable" class="datatable">';

//             rows.forEach((row, rowIndex) => {

//                 // Parse CSV row safely (handles commas inside quotes)
//                 const cells = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

//                 table += "<tr>";

//                 cells.forEach(cell => {
//                     // Remove quotes around CSV values
//                     cell = cell.replace(/^"|"$/g, "");

//                     if (rowIndex === 0) {
//                         table += `<th>${cell}</th>`;
//                     } else {
//                         table += `<td>${cell}</td>`;
//                     }
//                 });

//                 table += "</tr>";
//             });

//             table += "</table>";

//             $("#MBData_table").html(table);
//         }
//     });
//    });
// });


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


// Search all parameters in the main database table
function bigsearch() {
  const table = document.getElementById("myTable");
  if (!table) return;

  // ---- Column indices (adjust here if your table structure changes) ----
  const TYPE_COL = 2;  // Type: S/E/B/U
  const TEMP_COL = 4;  // Temperature (T)
  const CS_COL   = 5;  // CS
  const QS_COL   = 7;  // QS (note: your original used 7 here)
  const BHF_COL  = 9;  // Bhf (note: your original used 9 here)

  // ---- Selected types from checkboxes ----
  const selectedTypes = ["S", "E", "B", "U"].filter(t => {
    const el = document.getElementById(`tick${t}`);
    return el && el.checked;
  });

  // If none selected, we allow all types (still applies numeric filters).
  // If you prefer "require at least one selected", set this to true.
  const typeFilterActive = selectedTypes.length > 0;

  // ---- Numeric ranges with defaults if input is blank ----
  // T defaults 0..600; CS defaults 0..5; QS defaults unbounded; Bhf defaults 0..0
  const T   = getRange("min_3", "min_3_range",   [0, 600]);
  const CS  = getRange("min_4", "min_4_range",   [0, 5]);
  const QS  = getRange("min_5", "min_5_range",   [-Infinity, Infinity]); // no filter if blank
  const BHF = getRange("min_6", "min_6_range",   [0, 0]);

  // Prefer tbody rows if present; otherwise fall back to all <tr>
  const rows = table.tBodies && table.tBodies.length
    ? Array.from(table.tBodies[0].rows)
    : Array.from(table.getElementsByTagName("tr"));

  for (const row of rows) {
    const typeVal = getCellText(row, TYPE_COL).toUpperCase();
    const t   = getCellNumber(row, TEMP_COL);
    const cs  = getCellNumber(row, CS_COL);
    const qs  = getCellNumber(row, QS_COL);
    const bhf = getCellNumber(row, BHF_COL);

    const typeOk = !typeFilterActive || selectedTypes.includes(typeVal);
    const tOk    = inRange(t,   T.min,   T.max);
    const csOk   = inRange(cs,  CS.min,  CS.max);
    const qsOk   = inRange(qs,  QS.min,  QS.max);
    const bhfOk  = inRange(bhf, BHF.min, BHF.max);

    row.style.display = (typeOk && tOk && csOk && qsOk && bhfOk) ? "" : "none";
  }

  // ---- Helpers ----
  function getCellText(row, idx) {
    const cell = row.cells[idx];
    return cell ? cell.textContent.trim() : "";
  }

  function getCellNumber(row, idx) {
    // Handles decimal commas gracefully
    const txt = getCellText(row, idx).replace(",", ".");
    const num = parseFloat(txt);
    return Number.isFinite(num) ? num : null;
  }

  function inRange(val, min, max) {
    return val !== null && val >= min && val <= max;
  }

  function getRange(valueId, rangeId, defaultRange) {
    const valueEl = document.getElementById(valueId);
    const rangeEl = document.getElementById(rangeId);

    const vRaw = valueEl?.value?.trim();
    const rRaw = rangeEl?.value;

    const v = vRaw === "" || vRaw == null ? null : parseFloat(vRaw);
    const r = parseFloat(rRaw);

    if (v === null || !Number.isFinite(v) || !Number.isFinite(r)) {
      // If the value or its range is missing, fall back to default range
      return { min: defaultRange[0], max: defaultRange[1] };
    }
    return { min: v - r, max: v + r };
  }
}
