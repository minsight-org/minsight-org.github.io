function readText (form) {
    phase1=form.phase_1.value;
    linewidth_1 =form.linewidth_1.value;
	censhift_1 =form.censhift_1.value;
	qshift_1 =form.qshift_1.value;	
	hyperfinefield_1 =form.hyperfinefield_1.value;
	
	phase2=form.phase_2.value;
	linewidth_2 =form.linewidth_2.value;
	censhift_2 =form.censhift_2.value;
	qshift_2 =form.qshift_2.value;	
	hyperfinefield_2 =form.hyperfinefield_2.value;

	phase3=form.phase_3.value;
	linewidth_3 =form.linewidth_3.value;
	censhift_3 =form.censhift_3.value;
	qshift_3 =form.qshift_3.value;	
	hyperfinefield_3 =form.hyperfinefield_3.value;

	phase4=form.phase_4.value;
	linewidth_4 =form.linewidth_4.value;
	censhift_4 =form.censhift_4.value;
	qshift_4 =form.qshift_4.value;	
	hyperfinefield_4 =form.hyperfinefield_4.value;
}

function writeText_clearA (form) {
	form.phase_1.value = "unknown"
	form.phase_1b.value = "unknown"

	form.linewidth_1.value = "0.097"
	form.censhift_1.value = "0.0"
	form.qshift_1.value = "0.0"
	form.hyperfinefield_1.value = "0"
	form.ratio_1.value = "0"
}
function writeText_clearB (form) {
	form.phase_2.value = "unknown"
		form.phase_2b.value = "unknown"

	form.linewidth_2.value = "0.097"
	form.censhift_2.value = "0.0"
	form.qshift_2.value = "0.0"
	form.hyperfinefield_2.value = "0"
	form.ratio_2.value = "0"
}
function writeText_clearC (form) {
	form.phase_3.value = "unknown"
			form.phase_3b.value = "unknown"

	form.linewidth_3.value = "0.097"
	form.censhift_3.value = "0.0"
	form.qshift_3.value = "0.0"
	form.hyperfinefield_3.value = "0"
	form.ratio_3.value = "0"
}
function writeText_clearD (form) {
	form.phase_4.value = "unknown"
				form.phase_4b.value = "unknown"

	form.linewidth_4.value = "0.097"
	form.censhift_4.value = "0.0"
	form.qshift_4.value = "0.0"
	form.hyperfinefield_4.value = "0"
	form.ratio_4.value = "0"
}

function writeText_ferrihydrite (form) {
	form.phase_1.value = "Ferrihydrite"
		form.phase_1b.value = "Ferrihydrite"

    form.linewidth_1.value = "0.097"
	form.censhift_1.value = "0.38"
	form.qshift_1.value = "0.70"
	form.hyperfinefield_1.value = "0"
	form.ratio_1.value = "100"
}
function writeText_ferrihydriteB (form) {
	form.phase_2.value = "Ferrihydrite"
		form.phase_2b.value = "Ferrihydrite"

	form.linewidth_2.value = "0.097"
	form.censhift_2.value = "0.38"
	form.qshift_2.value = "0.70"
	form.hyperfinefield_2.value = "0"
	form.ratio_2.value = "100"
}
function writeText_ferrihydriteC (form) {
	form.phase_3.value = "Ferrihydrite"
				form.phase_3b.value = "Ferrihydrite"
	form.linewidth_3.value = "0.097"
	form.censhift_3.value = "0.38"
	form.qshift_3.value = "0.70"
	form.hyperfinefield_3.value = "0"
	form.ratio_3.value = "100"
}
function writeText_ferrihydriteD (form) {
	form.phase_4.value = "Ferrihydrite"
				form.phase_4b.value = "Ferrihydrite"

	form.linewidth_4.value = "0.097"
	form.censhift_4.value = "0.38"
	form.qshift_4.value = "0.70"
	form.hyperfinefield_4.value = "0"
	form.ratio_4.value = "100"
}



function writeText_hematite (form) {
	form.phase_1.value = "Hematite"
	form.phase_1b.value = "Hematite"

    form.linewidth_1.value = "0.097"
	form.censhift_1.value = "0.37"
	form.qshift_1.value = "-0.19"
	form.hyperfinefield_1.value = "51.7"
	form.ratio_1.value = "100"
}
function writeText_hematiteB (form) {
	form.phase_2.value = "Hematite"
	form.phase_2b.value = "Hematite"

    form.linewidth_2.value = "0.097"
	form.censhift_2.value = "0.37"
	form.qshift_2.value = "-0.19"
	form.hyperfinefield_2.value = "51.7"
	form.ratio_2.value = "100"
}
function writeText_hematiteC (form) {
	form.phase_3.value = "Hematite"
	form.phase_3b.value = "Hematite"

    form.linewidth_3.value = "0.097"
	form.censhift_3.value = "0.37"
	form.qshift_3.value = "-0.19"
	form.hyperfinefield_3.value = "51.7"
	form.ratio_3.value = "100"
}
function writeText_hematiteD (form) {
	form.phase_4.value = "Hematite"
	form.phase_4b.value = "Hematite"

    form.linewidth_4.value = "0.097"
	form.censhift_4.value = "0.37"
	form.qshift_4.value = "-0.19"
	form.hyperfinefield_4.value = "51.7"
	form.ratio_4.value = "100"
}




function writeText_magnetiteA (form) {
	form.phase_1.value = "Magnetite (A)"
	form.phase_1b.value = "Magnetite (A)"

    form.linewidth_1.value = "0.097"
	form.censhift_1.value = "0.35"
	form.qshift_1.value = "0.02"
	form.hyperfinefield_1.value = "49"
	form.ratio_1.value = "33"
}
function writeText_magnetiteAB (form) {
	form.phase_2.value = "Magnetite (A)"
	form.phase_2b.value = "Magnetite (A)"

    form.linewidth_2.value = "0.097"
	form.censhift_2.value = "0.35"
	form.qshift_2.value = "0.02"
	form.hyperfinefield_2.value = "49"
	form.ratio_2.value = "33"
}
function writeText_magnetiteAC (form) {
	form.phase_3.value = "Magnetite (A)"
	form.phase_3b.value = "Magnetite (A)"

    form.linewidth_3.value = "0.097"
	form.censhift_3.value = "0.35"
	form.qshift_3.value = "0.02"
	form.hyperfinefield_3.value = "49"
	form.ratio_3.value = "33"
}
function writeText_magnetiteAD (form) {
	form.phase_4.value = "Magnetite (A)"
	form.phase_4b.value = "Magnetite (A)"

    form.linewidth_4.value = "0.097"
	form.censhift_4.value = "0.35"
	form.qshift_4.value = "0.02"
	form.hyperfinefield_4.value = "49"
	form.ratio_4.value = "33"
}


function writeText_magnetiteB (form) {
	form.phase_1.value = "Magnetite (B)"
	form.phase_1b.value = "Magnetite (B)"

	form.linewidth_1.value = "0.196"
	form.censhift_1.value = "0.72"
	form.qshift_1.value = "0.01"
	form.hyperfinefield_1.value = "46"
	form.ratio_1.value = "66"
}
function writeText_magnetiteBB (form) {
	form.phase_2.value = "Magnetite (B)"
	form.phase_2b.value = "Magnetite (B)"

	form.linewidth_2.value = "0.196"
	form.censhift_2.value = "0.72"
	form.qshift_2.value = "0.01"
	form.hyperfinefield_2.value = "46"
	form.ratio_2.value = "66"
}
function writeText_magnetiteBC (form) {
	form.phase_3.value = "Magnetite (B)"
	form.phase_3b.value = "Magnetite (B)"

	form.linewidth_3.value = "0.196"
	form.censhift_3.value = "0.72"
	form.qshift_3.value = "0.01"
	form.hyperfinefield_3.value = "46"
	form.ratio_3.value = "66"
}
function writeText_magnetiteBD (form) {
	form.phase_4.value = "Magnetite (B)"
	form.phase_4b.value = "Magnetite (B)"

	form.linewidth_4.value = "0.196"
	form.censhift_4.value = "0.72"
	form.qshift_4.value = "0.01"
	form.hyperfinefield_4.value = "46"
	form.ratio_4.value = "66"
}

function writeText_goethite (form) {
	form.phase_1.value = "Goethite"
	form.phase_1b.value = "Goethite"

    form.linewidth_1.value = "0.097"
	form.censhift_1.value = "0.35"
	form.qshift_1.value = "0.25"
	form.hyperfinefield_1.value = "44"
	form.ratio_1.value = "100"
}
function writeText_goethiteB (form) {
	form.phase_2.value = "Goethite"
	form.phase_2b.value = "Goethite"

    form.linewidth_2.value = "0.097"
	form.censhift_2.value = "0.35"
	form.qshift_2.value = "0.25"
	form.hyperfinefield_2.value = "44"
	form.ratio_2.value = "100"
}
function writeText_goethiteC (form) {
	form.phase_3.value = "Goethite"
	form.phase_3b.value = "Goethite"

    form.linewidth_3.value = "0.097"
	form.censhift_3.value = "0.35"
	form.qshift_3.value = "0.25"
	form.hyperfinefield_3.value = "44"
	form.ratio_3.value = "100"
}
function writeText_goethiteD (form) {
	form.phase_4.value = "Goethite"
	form.phase_4b.value = "Goethite"

    form.linewidth_4.value = "0.097"
	form.censhift_4.value = "0.35"
	form.qshift_4.value = "0.25"
	form.hyperfinefield_4.value = "44"
	form.ratio_4.value = "100"
}





function writeText_siderite (form) {
	form.phase_1.value = "Siderite"
	form.phase_1b.value = "Siderite"

    form.linewidth_1.value = "0.097"
	form.censhift_1.value = "1.24"
	form.qshift_1.value = "1.8"
	form.hyperfinefield_1.value = "0"
	form.ratio_1.value = "100"
}
function writeText_sideriteB (form) {
	form.phase_2.value = "Siderite"
	form.phase_2b.value = "Siderite"

    form.linewidth_2.value = "0.097"
	form.censhift_2.value = "1.24"
	form.qshift_2.value = "1.8"
	form.hyperfinefield_2.value = "0"
	form.ratio_2.value = "100"
}
function writeText_sideriteC (form) {
	form.phase_3.value = "Siderite"
	form.phase_3b.value = "Siderite"

    form.linewidth_3.value = "0.097"
	form.censhift_3.value = "1.24"
	form.qshift_3.value = "1.8"
	form.hyperfinefield_3.value = "0"
	form.ratio_3.value = "100"
}
function writeText_sideriteD (form) {
	form.phase_4.value = "Siderite"
	form.phase_4b.value = "Siderite"

    form.linewidth_4.value = "0.097"
	form.censhift_4.value = "1.24"
	form.qshift_4.value = "1.8"
	form.hyperfinefield_4.value = "0"
	form.ratio_4.value = "100"
}





function writeText_vivianite (form) {
	form.phase_1.value = "Vivianite"
	form.phase_1b.value = "Vivianite"

    form.linewidth_1.value = "0.097"
	form.censhift_1.value = "1.35"
	form.qshift_1.value = "2.25"
	form.hyperfinefield_1.value = "0"
	form.ratio_1.value = "100"
}
function writeText_vivianiteB (form) {
	form.phase_2.value = "Vivianite"
	form.phase_2b.value = "Vivianite"

    form.linewidth_2.value = "0.097"
	form.censhift_2.value = "1.35"
	form.qshift_2.value = "2.25"
	form.hyperfinefield_2.value = "0"
	form.ratio_2.value = "100"
}
function writeText_vivianiteC (form) {
	form.phase_3.value = "Vivianite"
	form.phase_3b.value = "Vivianite"

    form.linewidth_3.value = "0.097"
	form.censhift_3.value = "1.35"
	form.qshift_3.value = "2.25"
	form.hyperfinefield_3.value = "0"
	form.ratio_3.value = "100"
}
function writeText_vivianiteD (form) {
	form.phase_4.value = "Vivianite"
	form.phase_4b.value = "Vivianite"

    form.linewidth_4.value = "0.097"
	form.censhift_4.value = "1.35"
	form.qshift_4.value = "2.25"
	form.hyperfinefield_4.value = "0"
	form.ratio_4.value = "100"
}




function writeText_metalFe (form) {
	form.phase_1.value = "Metallic Fe"
	form.phase_1b.value = "Metallic Fe"

    form.linewidth_1.value = "0.097"
	form.censhift_1.value = "0"
	form.qshift_1.value = "0"
	form.hyperfinefield_1.value = "33"
	form.ratio_1.value = "100"
}
function writeText_metalFeB (form) {
	form.phase_2.value = "Metallic Fe"
	form.phase_2b.value = "Metallic Fe"

    form.linewidth_2.value = "0.097"
	form.censhift_2.value = "0"
	form.qshift_2.value = "0"
	form.hyperfinefield_2.value = "33"
	form.ratio_2.value = "100"
}
function writeText_metalFeC (form) {
	form.phase_3.value = "Metallic Fe"
	form.phase_3b.value = "Metallic Fe"

    form.linewidth_3.value = "0.097"
	form.censhift_3.value = "0"
	form.qshift_3.value = "0"
	form.hyperfinefield_3.value = "33"
	form.ratio_3.value = "100"
}
function writeText_metalFeD (form) {
	form.phase_4.value = "Metallic Fe"
	form.phase_4b.value = "Metallic Fe"

    form.linewidth_4.value = "0.097"
	form.censhift_4.value = "0"
	form.qshift_4.value = "0"
	form.hyperfinefield_4.value = "33"
	form.ratio_4.value = "100"
}
