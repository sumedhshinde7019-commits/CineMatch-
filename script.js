 
            
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
            "<p>Unable to load movies. Check your API key and internet connection.</p>";
        console.error(error);
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
    details.innerHTML = "<p>Loading movie details...</p>";

    try {
        const movieResponse = await fetch(
            `${API_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`
        );

        const creditsResponse = await fetch(
            `${API_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
        );

        const videosResponse = await fetch(
            `${API_URL}/movie/${movieId}/videos?api_key=${API_KEY}`
        );

        if (!movieResponse.ok || !creditsResponse.ok || !videosResponse.ok) {
            throw new Error("Could not load all movie details.");
        }

        const movie = await movieResponse.json();
        const credits = await creditsResponse.json();
        const videos = await videosResponse.json();

        const director = credits.crew.find(person =>
            person.job === "Director"
        );

        const writers = credits.crew
            .filter(person =>
                person.job === "Writer" ||
                person.job === "Screenplay" ||
                person.job === "Story"
            )
            .map(person => person.name);

        const cast = credits.cast.slice(0, 12);

        const trailer = videos.results.find(video =>
            video.site === "YouTube" &&
            video.type === "Trailer" &&
            video.official
        ) || videos.results.find(video =>
            video.site === "YouTube" &&
            video.type === "Trailer"
        );

        details.innerHTML = "";

        const backButton = document.createElement("button");
        backButton.className = "back-button";
        backButton.textContent = "← Back to Movies";
        backButton.onclick = () => {
            details.style.display = "none";
            movies.style.display = "grid";
        };
        details.appendChild(backButton);

        const layout = document.createElement("div");
        layout.className = "details-layout";

        if (movie.poster_path) {
            const poster = document.createElement("img");
            poster.className = "detail-poster";
            poster.src = IMAGE_URL + movie.poster_path;
            poster.alt = movie.title + " poster";
            layout.appendChild(poster);
        }

        const info = document.createElement("div");
        info.className = "details-info";

        const title = document.createElement("h2");
        title.textContent = movie.title;
        info.appendChild(title);

        const release = document.createElement("p");
        release.textContent =
            "📅 Release Date: " + (movie.release_date || "Unknown");
        info.appendChild(release);

        const rating = document.createElement("p");
        rating.textContent =
            "⭐ Rating: " + Number(movie.vote_average).toFixed(1) + "/10";
        info.appendChild(rating);

        const runtime = document.createElement("p");
        runtime.textContent =
            "⏱️ Runtime: " +
            (movie.runtime ? movie.runtime + " minutes" : "Unavailable");
        info.appendChild(runtime);

        const genres = document.createElement("p");
        genres.textContent =
            "🎭 Genres: " +
            (movie.genres.map(genre => genre.name).join(", ") || "Unknown");
        info.appendChild(genres);

        const directorText = document.createElement("p");
        directorText.textContent =
            "🎬 Director: " + (director ? director.name : "Unknown");
        info.appendChild(directorText);

        const writerText = document.createElement("p");
        writerText.textContent =
            "✍️ Writers: " + (writers.join(", ") || "Unavailable");
        info.appendChild(writerText);

        layout.appendChild(info);
        details.appendChild(layout);

        const overviewTitle = document.createElement("h3");
        overviewTitle.textContent = "Movie Overview";
        details.appendChild(overviewTitle);

        const overview = document.createElement("p");
        overview.textContent = movie.overview || "No overview available.";
        details.appendChild(overview);

        const castTitle = document.createElement("h3");
        castTitle.textContent = "Cast";
        details.appendChild(castTitle);

        const castList = document.createElement("div");
        castList.className = "cast-list";

        cast.forEach(person => {
            const item = document.createElement("div");
            item.className = "cast-card";

            if (person.profile_path) {
                const image = document.createElement("img");
                image.src = PROFILE_URL + person.profile_path;
                image.alt = person.name;
                item.appendChild(image);
            }

            const name = document.createElement("p");
            name.textContent = person.name;
            item.appendChild(name);

            const character = document.createElement("p");
            character.textContent = person.character || "";
            item.appendChild(character);

            castList.appendChild(item);
        });

        details.appendChild(castList);

        const crewTitle = document.createElement("h3");
        crewTitle.textContent = "Key Crew";
        details.appendChild(crewTitle);

        const crewList = document.createElement("p");
        crewList.textContent = credits.crew
            .filter(person =>
                ["Director", "Producer", "Executive Producer",
                 "Director of Photography", "Editor", "Composer"]
                .includes(person.job)
            )
            .map(person => person.job + ": " + person.name)
            .filter((value, index, array) => array.indexOf(value) === index)
            .join("\n") || "Crew information unavailable.";

        crewList.style.whiteSpace = "pre-line";
        details.appendChild(crewList);

        const videoTitle = document.createElement("h3");
        videoTitle.textContent = "Videos & Trailers";
        details.appendChild(videoTitle);

        if (trailer) {
            const link = document.createElement("a");
            link.href = "https://www.youtube.com/watch?v=" + trailer.key;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "▶ Watch Official Trailer";
            details.appendChild(link);
        } else {
            const noTrailer = document.createElement("p");
            noTrailer.textContent = "No trailer available on TMDB.";
            details.appendChild(noTrailer);
        }

        const movieLink = document.createElement("a");
        movieLink.href = "https://www.themoviedb.org/movie/" + movie.id;
        movieLink.target = "_blank";
        movieLink.rel = "noopener noreferrer";
        movieLink.textContent = "View on TMDB";
        details.appendChild(movieLink);

        movies.style.display = "none";
        details.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
        details.innerHTML =
            "<p>Unable to load movie details. Please try again.</p>";
        console.error(error);
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
        
        const db = firebase.firestore();
        
        // ADD MOVIE TO FAVORITES

window.addToFavorites = async function(movie) {

    const user = auth.currentUser;

    if (!user) {
        alert("Please login to add favorite movies!");
        return;
    }

    try {
        await db.collection("users")
            .doc(user.uid)
            .collection("favorites")
            .doc(String(movie.id))
            .set({
                movieId: movie.id,
                title: movie.title,
                poster: movie.poster_path || "",
                rating: movie.vote_average || 0,
                releaseDate: movie.release_date || ""
            });

        alert("❤️ Movie added to favorites!");

    } catch (error) {
        console.error(error);
        alert("Unable to save favorite movie.");
    }
};

        console.log("Firebase connected successfully!");

        
        // CREATE ACCOUNT

        window.signUp = async function() {
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!username || !email || !password) {
                document.getElementById("authMessage").innerText =
                    "Please fill all fields.";
                return;
            }

            try {
                const result = await auth.createUserWithEmailAndPassword(
                    email, password
                );

                await result.user.updateProfile({
                    displayName: username
                });

                document.getElementById("authMessage").innerText =
                    "Account created successfully!";

            } catch (error) {
                document.getElementById("authMessage").innerText =
                    error.message;
            }
        };


        // LOGIN

        window.login = async function() {
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            try {
                await auth.signInWithEmailAndPassword(email, password);

                document.getElementById("authMessage").innerText =
                    "Login successful!";

            } catch (error) {
                document.getElementById("authMessage").innerText =
                    error.message;
            }
        };


        // LOGOUT

        window.logout = async function() {
            try {
                await auth.signOut();

                document.getElementById("authMessage").innerText =
                    "Logged out successfully!";

            } catch (error) {
                document.getElementById("authMessage").innerText =
                    error.message;
            }
        };


        // CHECK LOGIN STATUS

        auth.onAuthStateChanged(function(user) {
            const logoutButton =
                document.getElementById("logoutBtn");

            if (user) {
                document.getElementById("authMessage").innerText =
                    "Welcome, " + (user.displayName || user.email);

                logoutButton.style.display = "inline-block";

            } else {
                logoutButton.style.display = "none";
            }
        });

    } catch (error) {
        console.error("Firebase Error:", error);

        document.getElementById("authMessage").innerText =
            "Firebase loading failed. Check your internet connection.";
    }
}

startFirebase();
