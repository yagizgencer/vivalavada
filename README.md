## Cheers to Change: Exploring Temporal and Spatial Dynamics in Beer Trends

## Contributors

- [Yağız Gençer](https://github.com/yagizgencer)
- [Tuğba Tümer](https://github.com/tugbatumer)
- [Hadrien Sevel](https://github.com/hadriensevel)
- [Rishi Sinha](https://github.com/rishisinhanj)
- [Iris Toye](https://github.com/iris263)
  
## Abstract 

We propose in this study to analyze what are the beer trends by location, where do the trends originate, and how their evaluation and spreading over time reflects interconnection between countries. We shall make use of different ways to define a "beer trend" for a given location, such as the beer styles that are the most consumed, the beer styles with the highest ratings, the most popular beer producers (brewery or country), or the highest valued beer aspect (taste, aroma, etc.). Our motivation is to investigate whether countries that are close together, either geographically or socio-economically, have become more interconnected over time through the lens of beer and to discover the underlying factors playing a role in forming and shifting of beer trends.

Note: The beer dataset does not have enough data for beer trend analysis for each year and location. After initial preprocessing and analysis of data, we have decided to consider only the below given time range and location set for further analysis:

**Time range:** years from 2006 to 2017, including 2006 and 2017.

**Location set:** All states of U.S. except South Dakota (49 states), Iceland, Denmark, Canada, Norway, Sweden, Belgium, New Zealand, Ireland, Finland, Scotland, Australia, Netherlands, Luxembourg, England, Poland, Croatia, Northern Ireland, Spain, Italy, Germany, France and Brazil.

We regard each state of U.S. as a separate location rather than naming them all U.S.A. This is because most of the data comes from different states of U.S and it is a much bigger country than the other countries in our list so that reducing them all to a single name and location would waste too much data. Because of this decision, we call this a "location set" rather than a "country set".


## Research Questions

1. According to our above-given beer trend definitions, to what degree are we able to observe beer trends in our dataset, and if yes, how do they differ from location to location?

2. How do these beer consumption habits change over the years for each location? Where do these trends originate and how far/fast do they spread? How long do they last?

3. Are the beer trends of some locations considerably similar to that of some other locations? If yes, does the geographical distance between the locations play an important role in this? What could be the other reasons for such similarities (cultural ressemblance, brewery locations, wealth, etc.)?

4. Apart from the local beer trends followed in separate locations, do the overall beer consumption habits (trends) of all the locations tend to follow a particular pattern such that there are global trends? Which kind of trends (local vs. global) is more effective at each location and what could be the underlying reasons? As we know, “globalization” of the earth significantly increased the availability of long-distance transportation, communication, and trade. As the consequences of this globalization, did global trends begin to dominate over local ones?


## Additional Datasets 

1. [World Population Dataset](https://www.kaggle.com/datasets/iamsouravbanerjee/world-population-dataset): This dataset gives us population of each country by year, which is used to calculate the percentage of population of each country that have accounts in either of the websites. Population also gives us a further parameter to analyze the trends of each country. We merged our existing datasets of users, ratings, and breweries with the population dataset based on the attribute of location. We considered the year 2010 by reading the populations, which is a suitable year for our time range, from 2006 to 2017.

2. [Us State Population Dataset](https://www.census.gov/data/tables/time-series/demo/popest/2020s-state-total.html): We use this dataset with the same goal as the previous one, but for distinct states in the United States. Again, consider only the data from 2010 to be consistent with the country years.

3. [Languages Dataset](https://resourcewatch.org/data/explore/soc_071_world_languages?section=Discover&selectedCollection=&zoom=3&lat=0&lng=0&pitch=0&bearing=0&basemap=dark&labels=light&layers=%5B%7B%22dataset%22%3A%2220662342-dcdd-4a42-9f58-bcc80217de71%22%2C%22opacity%22%3A1%2C%22layer%22%3A%22f2d76e6b-060d-4dc9-83ea-284bef6b2aae%22%7D%5D&aoi=&page=1&sort=most-viewed&sortDirection=-1)
  This dataset gives information on what languages each country primarily speaks. It can confound the results on the similarity between the two countries' beer preferences. Our hypothesis is that same language should facilitate trade and culture. The dataset has 233 countries and has the top 3 official languages for each country.

4.  [US State Wealth Dataset](https://ssti.org/blog/useful-stats-capita-gross-state-product-1998-2018))
   This dataset gives the GDP per capita for each state in 2018. It also gives the percentage change over a 10 period time. Therefore, we can apply that change to see the GDP per capita for each US state in 2008 which falls into our year range of interest. 

5. [Country Wealth dataset](https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?end=2008&start=2007)
   This dataset gives the GDP per capita for each country for each year in terms of 2012 US dollars. In order to combine with the states dataset, we will only look at the year of 2008 only, and convert the value of the 2012 US dollar to its corresponding value in 2008 so that the values are comparable with the previous dataset. We shall use an [inflation calculator](https://www.bls.gov/data/inflation_calculator.htm) to make the adjustment.
   

## Methods 

### *Step 1: Preprocessing*

##### *1. Merging*

We were given data from two different websites - RateBeer and BeerAdvocate. in order not to waste any data, we merged the two datasets. The exact method followed by merging is given with comments in the notebook. To summarize, we removed the intersection of users and ratings from the data of individual websites to avoid duplicates using the matched dataset. We then added the intersection back again. Furthermore, we mapped every beer style and every beer_id, user_id and brewery_id in the matched data to its RateBeer version.

##### *2. Normalizing the Data*

We standardized the ratings and each aspect of the ratings (appareance, palate, taste, and aroma) by subtracting the mean of the year for the given website and then dividing by the standard deviation of that year. This way, biases coming from different level of ratings from the two websites and biases of rating inflations or deflations between different years are eliminated. As an end-effect, all the ratings in the merged dataset are directly comparable to each other.

##### *3. Filtering the Data*

We visualized the data and removed unreliable data points. For example, there were a few beers with higher than 50% alcohol percentages or users more than 20,000 ratings. Such datapoints are eliminated for more reliable future analysis.

##### *4. Reading in additional population datasets*

Our data consisted of users with locations and breweries with locations. The locations were either countries or states within the United States, so we combined two separate datasets on countries and US state populations to create a general population data frame. 

##### *5. Selecting Year Range and Locations*

In the notebook, we analysed for which years we have enough amount of data for analysis and decided to include only the years after and including 2006. For each location, we measured the number of distinct users divided by the total population and we only included locations where the percentage of users is high enough. We also put a condition that for each year of interest the valid locations should at least a predefined number of ratings. We ended up with 71 locations that satisfy all the conditions.

### *Step 2: Visualizations and Initial Analysis*

We plotted the locations we filtered out on a map, using the latitude and longitude coordinates from open street maps for each coordinate. We also plotted the brewery locations on a heatmap using a similar process. We then implemented some initial methods to find the most popular or highest rated beer styles/beer producers. We also fitted a basic OLS model to see the coefficients of each beer aspect (taste, appearance, etc.) to the overall rating. Lastly, we have found the Pearson correlation coeff. and corresponding p_value between the overall rating and alcohol by volume. Although basic, these analyses allowed us to better understand our data.


### *Step 3: Ideas for answering the research questions*
 
#### *Question 1*

We extract the most popular (in quantity) beer style and beer production place (brewery location) for each location by looking at the total number of ratings. We divide the number of ratings to the total number of ratings for that location to get a comparable result.

For investigating the beer styles and brewery locations with highest ratings, we take the average of the ratings and compare them, however we also put a threshold on number of ratings to be satisfied for being considered in this analysis. We standardize the ratings using location mean and standard deviation to get a comparable result. 

To find the highest valued beer aspect, we can run Ordinary Least Squares Linear Regression on our ratings for different locations. We were also thinking about using decision trees to predict rating based on the scores that people put in for each of the various aspects and to predict consumption. We will then test our dataset on a different subset of data to measure the accuracy.

#### *Question 2*

We can do the trend analysis described in question 1 for different years for each location. Then we can check the locations which have the same or similar trends, and the years they exhibit that trend. We can visualize spread and duration of trends using colors in world map.

#### *Question 3* 

We will study trends and trend evolutions to determine interconnexion between countries. This could be done with graph analysis, with weights combining different factors (information on the countries). We then want to match the locations based on 3 of the 4 categories: number of users divided by population, distance, language, and wealth. After matching, we can investigate the relationship between beer consumption trends of locations and to the property that we have not matched. Moreover, we can do t-tests of the data to see which factors between language, wealth, distance, and proportion of beer drinkers affect the trends the most, and whether there is a correlation.

#### *Question 4*

We can conduct the trend analysis described in question 1 globally for each year. If there is a global trend, we can check the similarity between that and the consumption trends of the other locations. For each year we can find which locations follow a similar trend to global one and we can investigate the reasons behind it using the methods in question 3. Moreover, we can look at the number of locations which exhibits more global trend compared to others and check if this number gets larger over the years.

### *Step 4: Data story with visualizations*

Using all the findings we obtained by answering the research questions, we plan to create a data story enriched by visualizations such as interactive plots. 


## Planning

1.12:
 - Interactive heatmap 
 - Trend definition and trend spreading
 - OLS linear regression and decision trees to find the most important aspects

8.12: 
 - Interconnexion between countries: graph studies
 - t-tests of the countrie's attributes that influence beer preferences

15.12: 
 - Represent the interaction/strength of links between countries on a map
 - Adding parameters to the interactive map (characteristics of the countries)
 - Combine the results and write the data story

22.12:
 - Finish the datastory
 - Finish the visualization


## Team organization

Tugba: Important aspects of beers using decision trees, create data story

Yagiz: Important aspects of beers with OLS, create data story

Hadrien: t-test for parameters that influence beer taste, representation of interaction on maps

Rishi: Interactive heatmap

Iris: Trend definition and graph analysis between countries
