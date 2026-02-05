//The expander *.js file enables a box containing help information to appear when it is pressed. 


$(window).load(function(){
$(".expheader").click(function () {

    $expheader = $(this);
    //getting the next element
    $content = $expheader.next();
    //open up the content needed - toggle the slide- if visible, slide up, if not slidedown.
    $content.slideToggle(500, function () {
        //execute this after slideToggle is done
        //change text of header based on visibility of content div
        $expheader.text(function () {
            //change text based on condition
            return $content.is(":visible") ? " \u2296 Close information" : " \u2295 Information";
        });
    });

});
});