var Scrapper = ( () => {

    const traversed = [];
    const emails = {
        urls : [],
        emails : []
    };

    let done = false;

    /**
     * returns emails list
     */
    const getEmails = () => {
        return JSON.stringify( emails );
    };

    /**
     * Requests html from given URL
     * @param url
     */
    const requestHTML = ( url ) => {
        "use strict";

        //cheap way to bypass same origin policy, may result in Error 429 if you're not careful
        const cors = 'https://cors-anywhere.herokuapp.com/';

        const xhr = new XMLHttpRequest();

        return new Promise ( ( resolve, reject ) => {

            xhr.onload = () => {
                if ( xhr.readyState === 4 ) {
                    if ( xhr.status === 200 ) {
                        resolve( xhr.responseText );
                    } else {
                        reject( {
                            status : xhr.status,
                            statusText : xhr.statusText
                        } );
                    }
                }
            };
            xhr.onprogress = ( event ) => {
                if ( event.lengthComputable ) { //Sometimes it is not computable 
                    console.log( 'Traversing ' + url + ': ' + Math.round( event.loaded / event.total * 100 ) + '%' );
                } else {
                    console.log( 'Traversing ' + url + ' ...' );
                }
            };
            xhr.onerror = () => {
                reject( {
                    status : xhr.status,
                    statusText : xhr.statusText
                } );
            };

            xhr.open( 'GET', cors + url, true );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );

            xhr.send();

        } );

    };

    /**
     * Parses given URL for emails
     * @param url
     */
    const traverse = async ( url ) => {
        "use strict";

        let html = await requestHTML( url );

        if ( html.length <= 0 ) return false;

        let parser = new DOMParser(),
            doc = parser.parseFromString( html.toString(), 'text/html' ),
            links = doc.querySelectorAll( 'a' ),
            baseUrl = url.replace( /^(?:http(s)?:\/\/)?(?:www\.)?/i, '' );

        emails.push( {
            URL : baseUrl,
            emails : []
        } );

        for ( let i = 0; i < links.length; i++ ) {
            if ( links[i].href && links[i].href.indexOf( url ) > -1 && !(/\[gif|jpg|jpeg|tiff|png|mp4|svg|webm|pdf|#|]/i).test( links[i].href ) && !traversed.includes( links[i].href ) ) {
                traversed.push( url.charAt( ( url.length-1 ) == '/' ? url.slice( 0, url.length-1 ) : url ) + links[i].attributes['href'].value.charAt( 0 ) == '/' ? links[i].attributes['href'].value.slice( 0, 1 ) : links[i].attributes['href'].value  );
                setTimeout( () => {
                    traverse( links[i].href );
                }, 5000 );
            }

            if ( ( links[i].href.indexOf( 'mailto:' ) > -1 || links[i].href.indexOf( '@' ) > -1 ) && ( emails.indexOf( links[i].href.replace( 'mailto:', '' ) ) < 0 ) ) {
                emails.push( {
                    URL : baseUrl,
                    email : links[i].attributes['href'].value.replace( 'mailto:', '' )
                } );
            }
        }

    };

    return {
        traverse : traverse,
        getEmails : getEmails
    }

})();
