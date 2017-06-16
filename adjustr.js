/* Proposito
A veces los subtítulos de las series tienen un desfase de algún segundo, o fracción de segundo. 
Sería muy cómodo poder re-generar los subtítulos con un decalaje determinado.

Por ejemplo, creo que mi fichero de subtítulos va 3 segundos adelantados:
tener una herramienta a la que pasar: 
1. fichero
2. horas:minutos:segundos que quiero ajustar (positivos o negativos) y que devuelva 
los subtitulos ajustados.

Ejemplo de subtítulos: 

1
00:00:10,389 --> 00:00:12,979
No, I'll get my car tomorrow.
I had too many.

2
00:00:13,016 --> 00:00:14,686
Got an Uber coming. Thank you.

3
00:00:17,854 --> 00:00:19,014
That was fast.

adjustr('filename.srt',+hh:mm:ss) -> el fichero filename.srt donde a todas las lineas
de aspecto 00:00:17,854 --> 00:00:19,014 se les ha sumado (o restado) hh:mm:ss

*/

var fs = require('fs');
// var assert=require('assert');

// gestionar horas y tal

function timeToHours(tiempo){
	// hh:mm:ss lo pasamos a horas, haciendo horas=hh+mm/60 (ignoro los segundos)
	var horaMinutoSegundo=tiempo.split(':');
	var hora=parseInt(horaMinutoSegundo[0]);
	var minuto=parseInt(horaMinutoSegundo[1]);
	var segundo=parseInt(horaMinutoSegundo[2]);
	return(hora + minuto/60 + segundo/3600);
}

function hoursToTime(decim){
	var horas=Math.trunc(decim);
	var resto=decim-horas;
	var minutosDec=resto*60;
	var minutos=Math.trunc(60*resto);
	resto=minutosDec-minutos;
	var segundos=Math.trunc(resto*60);
	return ({
		horas: horas,
		minutos: minutos,
		segundos: segundos
	});
}


// pattern matching and return position of hits

function getMatches(theString, theRegex){
	//console.log(theString);
	//console.log(theRegex);
	//console.log(theString.match(theRegex));
	return theString.match(theRegex).map(function(el) {
		var index = theString.indexOf(el);
		return [index, index + el.length - 1];
	});
}

String.prototype.replaceBetween = function(start, end, what) {
    return this.substring(0, start) + what + this.substring(end);
};




// MAIN FUNCTION!!

function adjustr(filename, offset) {

// procesa el parametro offset para obtener el signo y las horas, minutos y segundos.

	var sumaOResta=offset[0]; // me quedo con el signo
	offset=offset.substring(1,offset.length); // elimino el signo y me quedo con hh:mm:ss
	var offsetHMS=offset.split(':'); // offsetHMS[0] -> hh, offsetHMS[1] -> mm, offsetHMS[2] -> ss
	offsetHMS[0]=parseInt(offsetHMS[0]);
	offsetHMS[1]=parseInt(offsetHMS[1]);
	offsetHMS[2]=parseInt(offsetHMS[2]);

	var offsetDecimal=timeToHours(offset);

	 //para asegurarme que lee bien los parametros, y que los he pasado bien a Int

	//console.log(sumaOResta + '   ' + offsetHMS);
	//console.log(offsetDecimal);

	//console.log(offsetHMS[0]+10);
	//console.log(offsetHMS[1]+20);
	//console.log(offsetHMS[2]+30);


// lee el fichero a un buffer string

	fs.readFile(filename, 'utf8', function (err,data) {
	if (err) {
		return console.log(err);
	}

// aqui ya podemos hacer cosas con data, que es un string que contiene todo el texto del fichero

	var theRegex=/([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/g;

	var indexes=getMatches(data,theRegex); 
/* indexes tiene este aspecto: 
[ [ 452, 459 ],
  [ 469, 476 ],
  [ 531, 538 ],
  [ 548, 555 ],
  [ 595, 602 ],
  [ 612, 619 ],
  [ 595, 602 ],
  [ 612, 619 ],
  [ 1957, 1964 ] ]
	Hay que recorrer cada uno de sus elementos, y para ellos acceder al substring de data y sumar o restar el offset :)
*/
	var data2=data;
	
	
	var horaDecimal=0;
	var resulDecimal=0;
	var resulObjeto;
	var resulHMS="";
	for (var i=0;i<indexes.length;i++) {
		//console.log(data.substring(indexes[i][0],indexes[i][1]+1));
		horaDecimal=timeToHours(data.substring(indexes[i][0],indexes[i][1]+1));
		//console.log(horaDecimal);
		
		if (sumaOResta=='+') {
			resulDecimal=horaDecimal + offsetDecimal;
		}
		else {
			resulDecimal=horaDecimal - offsetDecimal;
		}

		resulObjeto=hoursToTime(resulDecimal);

		if (resulObjeto.horas <10) {
			resulObjeto.horas='0' + resulObjeto.horas;
		}
		if (resulObjeto.minutos <10) {
			resulObjeto.minutos='0' + resulObjeto.minutos;
		}
		if (resulObjeto.segundos <10) {
			resulObjeto.segundos='0' + resulObjeto.segundos;
		}		
		resulHMS=resulObjeto.horas + ':' + resulObjeto.minutos + ':' + resulObjeto.segundos;
		//console.log (resulHMS);



		data2=data2.replaceBetween(indexes[i][0],indexes[i][0]+8,resulHMS);
	}
	// console.log(data2);
	// data 2 contiene los subtitulos corregidos. Hay que escribirlos en un fichero
	fs.writeFile(process.argv[2]+'.ajustado', data2, function(err) {
    		if(err) {
        		return console.log(err);
    		}

    		console.log("Subtitulos ajustados y guardados en " + process.argv[2]+'.ajustado');
	});

	return(true);
}); // fin función callback tras leer el fichero

}
/*=====================================================================*/
// MAIN FUNCTION AND ENTRY POINT

// adjustr('subs.srt', '+01:33:15');
if (process.argv.length<4) {
	console.log('Necesitas 2 parametros: fichero con los subtítulos, y decalaje en este formato: +hh:mm:ss para sumar, -hh:mm:ss para restar');
}

//assert (process.argv.length==4,'fatal');

else {
	adjustr(process.argv[2],process.argv[3]);
}


