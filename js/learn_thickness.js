//Original source code: https://esr.phy.bme.hu/~tif/molecular_weight_calculator.html

atom=new Array();
atom["H"]= 1.00794;
atom["He"]= 4.0026;
atom["Li"]= 6.941;
atom["Be"]= 9.01218;
atom["B"]= 10.811;
atom["C"]= 12.011;
atom["N"]= 14.0067;
atom["O"]= 15.9994;
atom["F"]= 18.9984;
atom["Ne"]= 20.1797;
atom["Na"]= 22.98977;
atom["Mg"]= 24.305;
atom["Al"]=26.98154;
atom["Si"]= 28.0855;
atom["P"]= 30.97376;
atom["S"]= 32.066;
atom["Cl"]= 35.4527;
atom["Ar"]= 39.948;
atom["K"]= 39.0983;
atom["Ca"]= 40.078;
atom["Sc"]= 44.9559;
atom["Ti"]= 47.88;
atom["V"]= 50.9415;
atom["Cr"]= 51.996;
atom["Mn"]= 54.938;
atom["Fe"]= 55.847;
atom["Co"]= 58.9332;
atom["Ni"]= 58.6934;
atom["Cu"]= 63.546;
atom["Zn"]= 65.39;
atom["Ga"]= 69.723;
atom["Ge"]= 72.61;
atom["As"]= 74.9216;
atom["Se"]= 78.96;
atom["Br"]= 79.904;
atom["Kr"]= 83.8;
atom["Rb"]= 85.4678;
atom["Sr"]= 87.62;
atom["Y"]= 88.9059;
atom["Zr"]= 91.224;
atom["Nb"]= 92.9064;
atom["Mo"]= 95.94;
atom["Tc"]= 98;
atom["Ru"]= 101.07;
atom["Rh"]= 102.9055;
atom["Pd"]= 106.42;
atom["Ag"]= 107.868;
atom["Cd"]= 112.41;
atom["In"]= 114.82;
atom["Sn"]= 118.71;
atom["Sb"]= 121.757;
atom["Te"]= 127.6;
atom["I"]= 126.9045;
atom["Xe"]= 131.29;
atom["Cs"]= 132.9054;
atom["Ba"]= 137.33;
atom["La"]= 138.9055;
atom["Hf"]= 178.49;
atom["Ta"]= 180.9479;
atom["W"]= 183.85;
atom["Re"]= 186.207;
atom["Os"]= 190.2;
atom["Ir"]= 192.22;
atom["Pt"]= 195.08;
atom["Au"]= 196.9665;
atom["Hg"]= 200.59;
atom["Tl"]= 204.383;
atom["Pb"]= 207.2;
atom["Bi"]= 208.9804;
atom["Po"]= 209;
atom["At"]= 210;
atom["Rn"]= 222;
atom["Fr"]= 223;
atom["Ra"]= 226.0254;
atom["Ac"]= 227;
atom["Rf"]= 261;
atom["Db"]= 262;
atom["Sg"]= 263;
atom["Bh"]= 262;
atom["Hs"]= 265;
atom["Mt"]= 266;
atom["Uun"]= 269;
atom["Uuu"]= 272;
atom["Uub"]= 277;
atom["Ce"]= 140.12;
atom["Pr"]= 140.9077;
atom["Nd"]= 144.24;
atom["Pm"]= 145;
atom["Sm"]= 150.36;
atom["Eu"]= 151.965;
atom["Gd"]= 157.25;
atom["Tb"]= 158.9253;
atom["Dy"]= 162.5;
atom["Ho"]= 164.9303;
atom["Er"]= 167.26;
atom["Tm"]= 168.9342;
atom["Yb"]= 173.04;
atom["Lu"]= 174.967;
atom["Th"]= 232.0381;
atom["Pa"]= 231.0359;
atom["U"]= 238.029;
atom["Np"]= 237.0482;
atom["Pu"]= 244;
atom["Am"]= 243;
atom["Cm"]= 247;
atom["Bk"]= 247;
atom["Cf"]= 251;
atom["Es"]= 252;
atom["Fm"]= 257;
atom["Md"]= 258;
atom["No"]= 259;
atom["Lr"]= 262;

absmass=new Array();
absmass["H"]=0.387;
absmass["He"]=0.194;
absmass["Li"]=0.23;
absmass["Be"]=0.32;
absmass["B"]=0.51;
absmass["C"]=0.87;
absmass["N"]=1.4;
absmass["O"]=2.2;
absmass["F"]=2.7;
absmass["Ne"]=4;
absmass["Na"]=5.2;
absmass["Mg"]=6.8;
absmass["Al"]=9;
absmass["Si"]=12.4;
absmass["P"]=14.2;
absmass["S"]=17;
absmass["Cl"]=20;
absmass["Ar"]=21;
absmass["K"]=27;
absmass["Ca"]=32.5;
absmass["Sc"]=33;
absmass["Ti"]=42;
absmass["V"]=43;
absmass["Cr"]=48;
absmass["Mn"]=53;
absmass["Fe"]=64;
absmass["Co"]=66;
absmass["Ni"]=75;
absmass["Cu"]=82;
absmass["Zn"]=92;
absmass["Ga"]=97;
absmass["Ge"]=102;
absmass["As"]=126;
absmass["Se"]=110;
absmass["Br"]=130;
absmass["Kr"]=126;
absmass["Rb"]=21;
absmass["Sr"]=24.5;
absmass["Y"]=26;
absmass["Zr"]=28;
absmass["Nb"]=29.5;
absmass["Mo"]=34;
absmass["Tc"]=35.5;
absmass["Ru"]=37.5;
absmass["Rh"]=38;
absmass["Pd"]=41;
absmass["Ag"]=44;
absmass["Cd"]=46;
absmass["In"]=49;
absmass["Sn"]=54;
absmass["Sb"]=56;
absmass["Te"]=60;
absmass["I"]=61;
absmass["Xe"]=67;
absmass["Cs"]=71;
absmass["Ba"]=75;
absmass["La"]=76;
absmass["Ce"]=77;
absmass["Pr"]=81;
absmass["Nd"]=88;
absmass["Pm"]=92;
absmass["Sm"]=96;
absmass["Eu"]=100;
absmass["Gd"]=104;
absmass["Tb"]=107;
absmass["Dy"]=110;
absmass["Ho"]=115;
absmass["Er"]=120;
absmass["Tm"]=127;
absmass["Yb"]=133;
absmass["Lu"]=139;
absmass["Hf"]=145;
absmass["Ta"]=150;
absmass["W"]=155;
absmass["Re"]=160;
absmass["Os"]=165;
absmass["Ir"]=172;
absmass["Pt"]=178;
absmass["Au"]=191;
absmass["Hg"]=165;
absmass["Tl"]=123;
absmass["Pb"]=120;
absmass["Bi"]=123;
absmass["Po"]=126;
absmass["At"]=140;
absmass["Rn"]=60;
absmass["Fr"]=62;
absmass["Ra"]=65;
absmass["Ac"]=70;
absmass["Th"]=75;
absmass["Pa"]=80;
absmass["U"]=85;
absmass["Np"]=90;



uppercase="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
lowercase="abcdefghijklmnopqrstuvwxyz";
number="0123456789.";

function calculate(formula) {
   //precision=document.forms[0].elements[1].value;
   var precision=2;
   total=new Array(); level=0; total[0]=0; i=0; mass=0; name='';
   
   elmass=new Array();
   for (i=0; i<elmass.length;i++) {
      elmass[i]=null;
   }

   elmass[0]=new Array();
   for (i=0; i<elmass[0].length;i++) {
      elmass[0][i]=0;
   }

   i=0;

   while (formula.charAt(i)!="") {
      
      if ((uppercase+lowercase+number+"()").indexOf(formula.charAt(i))==-1) 
        i++;
      
      while (formula.charAt(i)=="(") {
         level++;
         i++;
         total[level]=0;

         elmass[level]=new Array();
         for (h=0; i<elmass[level].length;h++) {
            elmass[level][i]=0;
         } 
      }

      if (formula.charAt(i)==")") {
         mass=total[level];
         name='';
         level--;
      }

      else if (uppercase.indexOf(formula.charAt(i))!=-1) {
         name=formula.charAt(i);
         while (lowercase.indexOf(formula.charAt(i+1))!=-1 && formula.charAt(i+1)!="") 
            name+=formula.charAt(++i);
         
         mass=atom[name];

      }
      var amount="";
      while (number.indexOf(formula.charAt(i+1))!=-1 && formula.charAt(i+1)!="") 
         amount+=formula.charAt(++i);
      if (amount=="") amount="1";

      total[level]+=mass*parseFloat(amount);

      if (name=="") {
         for (ele in elmass[level+1]) {
               totalnumber=parseFloat(elmass[level+1][ele])*amount
            if (elmass[level][ele]==null) 
               elmass[level][ele]=totalnumber;
            else
               elmass[level][ele]=totalnumber+parseFloat(elmass[level][ele]);
          }
       }
       else {
          if (elmass[level][name]==null) 
             elmass[level][name]=amount;
          else 
             elmass[level][name]=parseFloat(elmass[level][name])+parseFloat(amount);
      }
      i++;
   }
   //weight=rounded(total[0],precision);
   weight=total[0];
   //weightB=totalB[0];





var sum=0;

   //previous=document.forms[1].elements[0].value;
   document.forms[1].elements[0].value="Formula: " + document.forms[0].elements[0].value+newline();
   document.forms[1].elements[0].value+="--------------------------------------------"+newline();
   for (ele in elmass[0]) {
      eltotal=eval(elmass[0][ele]*atom[ele]);

      document.forms[1].elements[0].value+=elmass[0][ele]+" "+ele+" * "+rounded(atom[ele],precision)+" = "+rounded(eltotal,precision)+" ("+rounded(eltotal/total[0]*100,precision)+"% of mass)"+newline();

      document.forms[1].elements[0].value+=absmass[ele]+" * "+rounded(eltotal/total[0],precision)+" = "+rounded(eltotal/total[0]*absmass[ele],precision)+newline();

      sum+=rounded(eltotal/total[0]*absmass[ele],precision);

   }

   document.forms[1].elements[0].value+="--------------------------------------------"+newline();
   document.forms[1].elements[0].value+="Molecular Weight: "+rounded(weight,precision)+" g/mol"+newline();
   document.forms[1].elements[0].value+="Mass absorption coefficient: " +rounded(sum,precision)+ "cm^2/g" + newline();
   document.forms[1].elements[0].value+="Ideal thickness: " +rounded(1/sum*1000,precision)+" mg/cm^2"+newline();

   //document.forms[1].elements[0].value+= "Total:"+weight+" g/mol"+newline();
   //document.forms[1].elements[0].value+="------------------------------------------------------------"+newline()+previous;
   //document.forms[1].elements[0].value+="------------------------------------------------------------"+newline();
   //document.forms[0].elements[0].value='';
   //document.forms[0].elements[0].focus();
}
      
function newline() 
{
        return (navigator.appName.substring(0,9)=="Microsoft")?'\r':'\n';
}


function rounded(number,init_precision)
{

   var rounded=Math.round(number*Math.pow(10,init_precision))/Math.pow(10,init_precision);
   var numStr=rounded+"";
   var percis=(numStr.substring(numStr.indexOf(".")+1,numStr.length)).length;
   if (numStr.indexOf(".")!=-1){
      var extrazeros=(init_precision-percis<0)?0:init_precision-percis;
      for (var i=0;i<extrazeros;i++){
         rounded=rounded+"0";
      }
   }
   return rounded;
}


function wtpercent() {
    var input = document.getElementById("wtcalc").value;
    var result=1/(input/100*64)*1000;
    document.getElementById('wtcalcresult').value = Math.round(result*1000)/1000;

}

function conc() {
    var input = document.getElementById("liquid").value;
    var iron = 55.847;
    var idealiron=15.63;
    var result=idealiron/(iron*input)*1000;
    document.getElementById('concresult').value = Math.round(result*1000)/1000;

}