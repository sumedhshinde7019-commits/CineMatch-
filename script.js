const API_KEY = "56d6e15266e5f7bac879f7ee7ecf9553";

const API_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const PROFILE_URL = "https://image.tmdb.org/t/p/w185";

async function loadMovies(query = "") {
const container = document.getElementById("movies");
const details = document.getElementById("movie-details");

details.style.display = "none";  
container.innerHTML = "<p>Loading movies...</p>";  

try {  
    let url;  

    if (query.trim()) {  
        url = `${API_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query.trim())}`;  
    } else {  
        url = `${API_URL}/movie/popular?api_key=${API_KEY}`;  
    }  

    const response = await fetch(url);  

    if (!response.ok) {  
        throw new Error("Movie request failed: " + response.status);  
    }  

    const data = await response.json();  
    container.innerHTML = "";  

    if (!data.results || data.results.length === 0) {  
        container.innerHTML = "<p>No movies found.</p>";  
        return;  
    }  

    data.results.forEach(movie => {  
        const card = document.createElement("div");  
        card.className = "movie-card";  
        card.style.cursor = "pointer";  

        if (movie.poster_path) {  
            const poster = document.createElement("img");  
            poster.src = IMAGE_URL + movie.poster_path;  
            poster.alt = movie.title;  
            card.appendChild(poster);  
        }  

        const title = document.createElement("h3");  
        title.textContent = movie.title;  
        card.appendChild(title);  

        const rating = document.createElement("p");  
        rating.textContent =  
            "⭐ " + Number(movie.vote_average).toFixed(1) + "/10";  
        card.appendChild(rating);  

        const release = document.createElement("p");  
        release.textContent =  
            "📅 " + (movie.release_date || "Release date unavailable");  
        card.appendChild(release);  

        // FAVORITE BUTTON

const favoriteButton = document.createElement("button");
favoriteButton.textContent = "❤️ Add to Favorites";

favoriteButton.style.backgroundColor = "green";
favoriteButton.style.color = "white";

favoriteButton.onclick = (event) => {
event.stopPropagation();
addToFavorites(movie);
};

card.appendChild(favoriteButton);

// WATCHLIST BUTTON

const watchlistButton = document.createElement("button");
watchlistButton.textContent = "📌 Add to Watchlist";

watchlistButton.style.backgroundColor = "#ffc107";
watchlistButton.style.color = "#111";

watchlistButton.onclick = (event) => {
event.stopPropagation();
addToWatchlist(movie);
};

card.appendChild(watchlistButton);

const button = document.createElement("button");
button.textContent = "View Details";
button.onclick = () => showMovieDetails(movie.id);
card.appendChild(button);

card.onclick = event => {  
            if (event.target !== button) {  
                showMovieDetails(movie.id);  
            }  
        };  

        container.appendChild(card);  
    });  

} catch (error) {  
container.innerHTML =  
    "<p>Movie Error: " + error.message + "</p>";  
console.error("TMDB ERROR:", error);

}
}

function searchMovie() {
const input = document.getElementById("search");
loadMovies(input.value);
}

async function showMovieDetails(movieId) {
const details = document.getElementById("movie-details");
const movies = document.getElementById("movies");

details.style.display = "block";  
movies.style.display = "none";  
details.innerHTML = "<p>Loading movie...</p>";  

try {  
    const [movieRes, creditsRes, videosRes] = await Promise.all([  
        fetch(`${API_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`),  
        fetch(`${API_URL}/movie/${movieId}/credits?api_key=${API_KEY}`),  
        fetch(`${API_URL}/movie/${movieId}/videos?api_key=${API_KEY}`)  
    ]);  

    if (!movieRes.ok || !creditsRes.ok || !videosRes.ok) {  
        throw new Error("Unable to load movie information.");  
    }  

    const movie = await movieRes.json();  
    const credits = await creditsRes.json();  
    const videos = await videosRes.json();  

    const director = credits.crew.find(p => p.job === "Director");  

    const writers = credits.crew  
        .filter(p => ["Writer", "Screenplay", "Story"].includes(p.job))  
        .map(p => p.name);  

    const trailer = videos.results.find(v =>  
        v.site === "YouTube" &&  
        v.type === "Trailer" &&  
        v.official  
    ) || videos.results.find(v =>  
        v.site === "YouTube" && v.type === "Trailer"  
    );  

    details.innerHTML = "";  

    // BACK BUTTON  
    const back = document.createElement("button");  
    back.className = "cinema-back-button";  
    back.textContent = "← Back to Movies";  

    back.onclick = function () {  
        details.style.display = "none";  
        movies.style.display = "grid";  
    };  

    details.appendChild(back);  

    // CINEMATIC BACKDROP  
    const hero = document.createElement("div");  
    hero.className = "cinema-hero";  

    if (movie.backdrop_path) {  
        hero.style.backgroundImage =  
            `linear-gradient(90deg,rgba(3,15,15,.94),rgba(3,15,15,.55)),url("https://image.tmdb.org/t/p/original${movie.backdrop_path}")`;  
    }  

    const content = document.createElement("div");  
    content.className = "cinema-hero-content";  

    // POSTER  
    if (movie.poster_path) {  
        const poster = document.createElement("img");  
        poster.className = "cinema-main-poster";  
        poster.src = IMAGE_URL + movie.poster_path;  
        poster.alt = movie.title;  
        content.appendChild(poster);  
    }  

    // INFORMATION  
    const info = document.createElement("div");  
    info.className = "cinema-main-info";  

    const title = document.createElement("h1");  
    title.textContent = movie.title;  
    info.appendChild(title);  

    const tagline = document.createElement("p");  
    tagline.className = "cinema-tagline";  
    tagline.textContent = movie.tagline || "Discover the story.";  
    info.appendChild(tagline);  

    const meta = document.createElement("div");  
    meta.className = "cinema-meta";  

    [  
        "⭐ " + Number(movie.vote_average).toFixed(1) + "/10",  
        "📅 " + (movie.release_date || "Unknown"),  
        "⏱ " + (movie.runtime || "N/A") + " min"  
    ].forEach(text => {  
        const span = document.createElement("span");  
        span.textContent = text;  
        meta.appendChild(span);  
    });  

    info.appendChild(meta);  

    const genres = document.createElement("div");  
    genres.className = "cinema-genres";  

    movie.genres.forEach(genre => {  
        const span = document.createElement("span");  
        span.textContent = genre.name;  
        genres.appendChild(span);  
    });  

    info.appendChild(genres);  

    const actions = document.createElement("div");  
    actions.className = "cinema-actions";  

    if (trailer) {  
        const trailerButton = document.createElement("a");  
        trailerButton.className = "cinema-trailer-button";  
        trailerButton.href =  
            "https://www.youtube.com/watch?v=" + trailer.key;  
        trailerButton.target = "_blank";  
        trailerButton.rel = "noopener noreferrer";  
        trailerButton.textContent = "▶ Watch Trailer";  
        actions.appendChild(trailerButton);  
    }  

    const watchButton = document.createElement("button");  
    watchButton.className = "cinema-watch-button";  
    watchButton.textContent = "📌 Add to Watchlist";  
    watchButton.onclick = () => addToWatchlist(movie);  
    actions.appendChild(watchButton);  

    info.appendChild(actions);  
    content.appendChild(info);  
    hero.appendChild(content);  
    details.appendChild(hero);  

    // OVERVIEW  
    const overviewTitle = document.createElement("h2");  
    overviewTitle.className = "cinema-section-title";  
    overviewTitle.textContent = "About the Movie";  
    details.appendChild(overviewTitle);  

    const overview = document.createElement("p");  
    overview.className = "cinema-overview";  
    overview.textContent = movie.overview || "No overview available.";  
    details.appendChild(overview);  

    // DIRECTOR AND WRITERS  
    const crew = document.createElement("div");  
    crew.className = "cinema-crew-info";  

    const directorInfo = document.createElement("p");  
    directorInfo.innerHTML = "<strong>Director</strong><br>";  
    directorInfo.appendChild(  
        document.createTextNode(director ? director.name : "Unknown")  
    );  
    crew.appendChild(directorInfo);  

    const writerInfo = document.createElement("p");  
    writerInfo.innerHTML = "<strong>Writers</strong><br>";  
    writerInfo.appendChild(  
        document.createTextNode(writers.join(", ") || "Unavailable")  
    );  
    crew.appendChild(writerInfo);  

    details.appendChild(crew);  

    // CAST  
    const castTitle = document.createElement("h2");  
    castTitle.className = "cinema-section-title";  
    castTitle.textContent = "Cast & Actors";  
    details.appendChild(castTitle);  

    const castList = document.createElement("div");  
    castList.className = "cinema-cast-list";  

    credits.cast.slice(0, 12).forEach(person => {  
        const card = document.createElement("div");  
        card.className = "cinema-cast-card";  

        const image = document.createElement("img");  
        image.src = person.profile_path  
            ? PROFILE_URL + person.profile_path  
            : "https://placehold.co/150x190/102522/ffffff?text=No+Photo";  
        image.alt = person.name;  
        card.appendChild(image);  

        const name = document.createElement("h4");  
        name.textContent = person.name;  
        card.appendChild(name);  

        const character = document.createElement("p");  
        character.textContent = person.character || "";  
        card.appendChild(character);  

        castList.appendChild(card);  
    });  

    details.appendChild(castList);  

    // KEY CREW  
    const crewTitle = document.createElement("h2");  
    crewTitle.className = "cinema-section-title";  
    crewTitle.textContent = "Behind the Film";  
    details.appendChild(crewTitle);  

    const crewGrid = document.createElement("div");  
    crewGrid.className = "cinema-key-crew";  

    credits.crew.filter(p =>  
        ["Producer", "Editor", "Composer",  
         "Director of Photography"].includes(p.job)  
    ).slice(0, 8).forEach(person => {  
        const card = document.createElement("div");  
        card.className = "cinema-key-crew-card";  
        card.innerHTML = "<strong>" + person.job + "</strong>";  

        const name = document.createElement("p");  
        name.textContent = person.name;  
        card.appendChild(name);  

        crewGrid.appendChild(card);  
    });  

    details.appendChild(crewGrid);  

    // REVIEWS  
    const reviewTitle = document.createElement("h2");  
    reviewTitle.className = "cinema-section-title";  
    reviewTitle.textContent = "⭐ Audience Reviews";  
    details.appendChild(reviewTitle);  

    const reviewSection = document.createElement("div");  
    reviewSection.id = "reviewSection";  
    reviewSection.className = "cinema-review-section";  

    const label = document.createElement("label");  
    label.textContent = "Rate this movie:";  
    reviewSection.appendChild(label);  

    const rating = document.createElement("select");  
    rating.id = "reviewRating";  

    for (let i = 5; i >= 1; i--) {  
        const option = document.createElement("option");  
        option.value = i;  
        option.textContent = "⭐".repeat(i) + " (" + i + "/5)";  
        rating.appendChild(option);  
    }  

    reviewSection.appendChild(rating);  

    const input = document.createElement("textarea");  
    input.id = "reviewText";  
    input.placeholder = "Write your review...";  
    input.maxLength = 1000;  
    reviewSection.appendChild(input);  

    const submit = document.createElement("button");  
    submit.textContent = "Submit Review";  
    submit.onclick = () => submitMovieReview(movie.id);  
    reviewSection.appendChild(submit);  

    const reviews = document.createElement("div");  
    reviews.id = "reviewsList";  
    reviewSection.appendChild(reviews);  

    details.appendChild(reviewSection);  

    if (window.loadMovieReviews) {  
        window.loadMovieReviews(movie.id);  
    }  

    details.scrollIntoView({  
        behavior: "smooth",  
        block: "start"  
    });  

} catch (error) {  
    console.error("Movie details error:", error);  
    details.innerHTML =  
        "<p>Unable to load movie details. Please try again.</p>";  
}

}

document.addEventListener("DOMContentLoaded", function () {
const input = document.getElementById("search");

if (input) {  
    input.addEventListener("keydown", function (event) {  
        if (event.key === "Enter") {  
            searchMovie();  
        }  
    });  
}  

loadMovies();

});

if (document.readyState !== "loading") {
loadMovies();
}

// FIREBASE CONFIGURATION

const firebaseConfig = {
apiKey: "AIzaSyCyMC0qRRtHVfkmNhxN_w1coWmdi5vi680",
authDomain: "cinematch-82e08.firebaseapp.com",
projectId: "cinematch-82e08",
storageBucket: "cinematch-82e08.firebasestorage.app",
messagingSenderId: "262139517198",
appId: "1:262139517198:web:73e5640d6a099b33cc9f5f",
measurementId: "G-YWYP1ZW46T"
};

// LOAD FIREBASE

function loadFirebaseScript(url) {
return new Promise((resolve, reject) => {
const script = document.createElement("script");
script.src = url;
script.onload = resolve;
script.onerror = reject;
document.head.appendChild(script);
});
}

// START FIREBASE

async function startFirebase() {
try {
await loadFirebaseScript(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

await loadFirebaseScript(  
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"  
    );  
      
    await loadFirebaseScript(  
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"

);

firebase.initializeApp(firebaseConfig);  

    const auth = firebase.auth();  
      
    window.showProfile = function() {  
const user = auth.currentUser;  

if (!user) {  
    alert("Please login first!");  
    return;  
}  

document.getElementById("profileName").innerText =  
    user.displayName || "Not provided";  

document.getElementById("profileEmail").innerText =  
    user.email || "Not available";  

document.getElementById("profileUID").innerText =  
    user.uid;  

document.getElementById("profileDate").innerText =  
    user.metadata.creationTime  
        ? new Date(user.metadata.creationTime).toLocaleDateString()  
        : "Not available";  

document.getElementById("profileSection").style.display = "block";

};

window.closeProfile = function() {
document.getElementById("profileSection").style.display = "none";
};

document.getElementById("profileImageInput").addEventListener("change", function(event) {
const file = event.target.files[0];

if (!file) return;  

if (!file.type.startsWith("image/")) {  
    alert("Please select an image.");  
    return;  
}  

if (file.size > 2 * 1024 * 1024) {  
    alert("Please select an image smaller than 2 MB.");  
    return;  
}  

const reader = new FileReader();  

reader.onload = function() {  
    document.getElementById("profilePicture").src = reader.result;  

    if (auth.currentUser) {  
        localStorage.setItem(  
            "profilePicture_" + auth.currentUser.uid,  
            reader.result  
        );  
    }  
};  

reader.readAsDataURL(file);

});

const db = firebase.firestore();  
      
    // ADD MOVIE TO WATCHLIST

window.addToWatchlist = async function(movie) {

const user = auth.currentUser; if (!user) { alert("Please login to use your watchlist!"); return; } try { await db.collection("users") .doc(user.uid) .collection("watchlist") .doc(String(movie.id)) .set({ movieId: movie.id, title: movie.title, poster: movie.poster_path || "", rating: movie.vote_average || 0, releaseDate: movie.release_date || "" }); alert("📌 Movie added to your watchlist!"); } catch (error) { console.error(error); alert("Unable to add movie to watchlist."); }

};

// LOAD MY WATCHLIST

window.loadWatchlist = async function() {

const container = document.getElementById("watchlistMovies"); const user = auth.currentUser; if (!user) { container.innerHTML = "<p>Please login to view your watchlist.</p>"; return; } container.innerHTML = "<p>Loading your watchlist...</p>"; try { const snapshot = await db.collection("users") .doc(user.uid) .collection("watchlist") .get(); container.innerHTML = ""; if (snapshot.empty) { container.innerHTML = "<p>Your watchlist is empty.</p>"; return; } snapshot.forEach(doc => { const movie = doc.data(); const card = document.createElement("div"); card.className = "movie-card"; if (movie.poster) { const poster = document.createElement("img"); poster.src = IMAGE_URL + movie.poster; poster.alt = movie.title; card.appendChild(poster); } const title = document.createElement("h3"); title.textContent = movie.title; card.appendChild(title); const rating = document.createElement("p"); rating.textContent = "⭐ " + movie.rating + "/10"; card.appendChild(rating); const removeButton = document.createElement("button"); removeButton.textContent = "❌ Remove"; removeButton.onclick = async function() { await db.collection("users") .doc(user.uid) .collection("watchlist") .doc(doc.id) .delete(); window.loadWatchlist(); }; card.appendChild(removeButton); container.appendChild(card); }); } catch (error) { console.error(error); container.innerHTML = "<p>Unable to load watchlist.</p>"; }

};

// SUBMIT MOVIE REVIEW

window.submitMovieReview = async function(movieId) {
const user = auth.currentUser;

if (!user) {  
    alert("Please login to write a review!");  
    return;  
}  

const rating = Number(  
    document.getElementById("reviewRating").value  
);  

const reviewText = document.getElementById("reviewText").value.trim();  

if (!reviewText) {  
    alert("Please write your review!");  
    return;  
}  

try {  
    await db.collection("movieReviews")  
        .doc(String(movieId))  
        .collection("reviews")  
        .doc(user.uid)  
        .set({  
            username: user.displayName || "Movie Lover",  
            rating: rating,  
            review: reviewText,  
            createdAt: firebase.firestore.FieldValue.serverTimestamp()  
        });  

    document.getElementById("reviewText").value = "";  

    alert("Your review has been submitted!");  

    window.loadMovieReviews(movieId);  

} catch (error) {  
    console.error(error);  
    alert("Unable to submit review. Please try again.");  
}

};

// LOAD MOVIE REVIEWS

window.loadMovieReviews = async function(movieId) {
const reviewsList = document.getElementById("reviewsList");

if (!reviewsList) return;  

reviewsList.innerHTML = "<p>Loading reviews...</p>";  

try {  
    const snapshot = await db.collection("movieReviews")  
        .doc(String(movieId))  
        .collection("reviews")  
        .get();  

    reviewsList.innerHTML = "";  

    if (snapshot.empty) {  
        reviewsList.innerHTML = "<p>No reviews yet. Be the first!</p>";  
        return;  
    }  

    snapshot.forEach(doc => {  
        const data = doc.data();  

        const reviewCard = document.createElement("div");  
        reviewCard.className = "review-card";  

        const username = document.createElement("h4");  
        username.textContent = "👤 " + data.username;  
        reviewCard.appendChild(username);  

        const rating = document.createElement("p");  
        rating.textContent = "⭐".repeat(data.rating) +  
            " (" + data.rating + "/5)";  
        reviewCard.appendChild(rating);  

        const review = document.createElement("p");  
        review.textContent = data.review;                                 
